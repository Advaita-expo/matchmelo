import {auth,requestMember} from './auth';
import {runtime,localOnly,appUrl} from './runtime';
import {isSameOrigin} from './passport-validation';
import {isReviewer} from './passports';
import {AppError,db,now,limit,eraseMember} from './member-data';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
export async function authHandler(request:Request){
  if(!['GET','HEAD'].includes(request.method)&&!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  const path=new URL(request.url).pathname;
  if(['/sign-up/email','/request-password-reset','/send-verification-email'].some(suffix=>path.endsWith(suffix))&&runtime().APP_ENV!=='development'&&(!runtime().RESEND_API_KEY||!runtime().EMAIL_FROM))return json({message:'Account email delivery must be configured before registering or recovering accounts.',code:'EMAIL_NOT_CONFIGURED'},503);
  if(path.endsWith('/sign-up/email')){
    const input=await request.clone().json().catch(()=>null) as Record<string,unknown>|null;
    if(input&&(typeof input.name!=='string'||input.name.trim().length<2||input.name.trim().length>35||typeof input.email!=='string'||input.email.length>254))return json({message:'Use a first name of 2–35 characters and a valid email address.'},400);
    if(!input||input.adult!==true||input.policy!==true)return json({message:'Confirm you are 18 or over and accept the terms and privacy notice.',code:'CONSENT_REQUIRED'},400);
  }
  if(path.endsWith('/delete-user')){
    const user=await requestMember(request);if(!user)return json({error:'Please sign in.'},401);
    const session=await auth().api.getSession({headers:request.headers});
    if(!session||Date.now()-new Date(session.session.createdAt).getTime()>5*60*1000)return json({message:'Sign in again before deleting your account.',code:'SESSION_NOT_FRESH'},403);
  }
  return auth().handler(request);
}
export async function securityApi(request:Request){
  try{
    const path=new URL(request.url).pathname;
    if(path==='/api/dev/mailbox'){
      if(!localOnly(request))return json({error:'Not found.'},404);
      const email=new URL(request.url).searchParams.get('email');
      if(!email)return json({error:'Choose a local test email.'},400);
      const rows=await db().prepare('SELECT id,recipient,subject,link,created_at FROM local_mail_outbox WHERE recipient=? ORDER BY created_at DESC LIMIT 10').bind(email).all();return json({messages:rows.results});
    }
    const user=await requestMember(request);if(!user)return json({error:'Please sign in.'},401);
    if(request.method!=='GET'&&!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
    if(path==='/api/account/export'){
      await limit('export:'+user.userId,3,3600);
      const DB=db(),passport=await DB.prepare('SELECT * FROM passports WHERE user_id=?').bind(user.userId).first<Record<string,unknown>>();if(passport)delete passport.selfie_key;
      const prefs=await DB.prepare('SELECT * FROM member_preferences WHERE user_id=?').bind(user.userId).first();
      const messages=(await DB.prepare('SELECT id,match_id,text,created_at FROM member_messages WHERE sender_id=? ORDER BY created_at DESC LIMIT 10000').bind(user.userId).all()).results;
      return json({exportedAt:now(),account:{name:user.displayName,email:user.email,emailVerified:user.emailVerified},passport,preferences:prefs,messages});
    }
    if(path==='/api/moderation/reports'){
      if(!isReviewer(user))return json({error:'Reviewer access required.'},403);
      if(request.method==='GET'){const rows=await db().prepare("SELECT r.*,p.name target_name FROM member_reports r LEFT JOIN passports p ON p.user_id=r.target_id WHERE r.status='open' ORDER BY r.created_at LIMIT 100").all();return json({reports:rows.results});}
      const data=await request.json() as {id:string;action:string;note:string};if(!['dismiss','resolve','suspend'].includes(data.action))return json({error:'Choose a valid action.'},400);
      const report=await db().prepare('SELECT target_id FROM member_reports WHERE id=?').bind(data.id).first<{target_id:string}>();if(!report)return json({error:'Report not found.'},404);
      const actions=[db().prepare('UPDATE member_reports SET status=?,moderator_note=?,resolved_at=? WHERE id=?').bind(data.action==='dismiss'?'dismissed':'resolved',String(data.note||'').slice(0,1000),now(),data.id),db().prepare('INSERT INTO moderation_audit (id,actor_id,target_id,action,note,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,report.target_id,data.action,String(data.note||'').slice(0,1000),now())];
      if(data.action==='suspend')actions.push(db().prepare('UPDATE auth_user SET disabled=1 WHERE id=?').bind(report.target_id),db().prepare('DELETE FROM auth_session WHERE user_id=?').bind(report.target_id),db().prepare('UPDATE member_preferences SET visibility=0 WHERE user_id=?').bind(report.target_id),db().prepare("UPDATE call_sessions SET status='ended',ended_at=? WHERE (caller_id=? OR recipient_id=?) AND status IN ('invited','accepted','active')").bind(now(),report.target_id,report.target_id));
      await db().batch(actions);return json({ok:true});
    }
    return json({error:'Not found.'},404);
  }catch(e){return json({error:e instanceof AppError?e.message:'We could not complete that request.'},e instanceof AppError?e.status:500);}
}
