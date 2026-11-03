import {runtime,appUrl} from './runtime';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function sendAccountEmail(to:string,subject:string,url:string){
  const config=runtime();const parsed=new URL(url);if(parsed.origin!==appUrl())throw new Error('Invalid email link origin.');
  if(config.APP_ENV==='development'&&['127.0.0.1','localhost','[::1]'].includes(new URL(config.APP_URL).hostname)){
    await config.DB.prepare('INSERT INTO local_mail_outbox (id,recipient,subject,link,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),to,subject,url,new Date().toISOString()).run();return;
  }
  if(!config.RESEND_API_KEY||!config.EMAIL_FROM)throw new Error('Account email delivery is not configured.');
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:config.EMAIL_FROM,to:[to],subject,text:`${subject}\n\nContinue securely: ${url}\n\nIf you did not request this, ignore this email.`,html:`<div style="font-family:Arial,sans-serif;color:#244b3d;max-width:520px;margin:auto;padding:30px"><h1>matchmelo.</h1><h2>${escape(subject)}</h2><p>A little step to keep your account yours.</p><p><a href="${escape(url)}" style="background:#244b3d;color:white;padding:14px 22px;border-radius:6px;display:inline-block">Continue securely</a></p><p style="color:#78836d;font-size:12px">If you did not request this, ignore this email. Never share this link.</p></div>`})});
  if(!response.ok)throw new Error('Account email could not be delivered.');
}
