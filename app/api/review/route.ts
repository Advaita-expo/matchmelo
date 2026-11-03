export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import {getRequestUser} from '@/lib/passports';
import {bindings,isReviewer,json} from '@/lib/passports';
import {isSameOrigin} from '@/lib/passport-validation';
export async function POST(request:Request){
  const user=await getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);if(!isReviewer(user))return json({error:'Reviewer access is required.'},403);
  if(!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  const body=await request.json() as {id:string;decision:string;note:string;updatedAt:string;reviewedEvidence:boolean};
  const decision=body.decision,note=String(body.note||'').trim().slice(0,500);
  if(!['reviewed','needs_update'].includes(decision)||!body.id||!body.updatedAt)return json({error:'Invalid review.'},400);
  if(decision==='needs_update'&&!note)return json({error:'Add a helpful reason for the member.'},400);
  const DB=bindings().DB,now=new Date().toISOString();
  const target=await DB.prepare('SELECT user_id,selfie_key FROM passports WHERE id=?').bind(body.id).first<{user_id:string;selfie_key:string|null}>();if(!target)return json({error:'Passport not found.'},404);if(target.user_id===user.userId)return json({error:'Another authorized reviewer must review your own profile.'},403);
  if(decision==='reviewed'&&(body.reviewedEvidence!==true||!target.selfie_key||!await DB.prepare('SELECT 1 FROM profile_photos WHERE user_id=? LIMIT 1').bind(target.user_id).first()))return json({error:'Review the private selfie and at least one profile photo before approving.'},400);
  const result=await DB.batch([
    DB.prepare("UPDATE passports SET review_status=?,review_note=?,reviewed_at=?,updated_at=? WHERE id=? AND review_status='pending' AND updated_at=?").bind(decision,note||null,now,now,body.id,body.updatedAt),
    DB.prepare('INSERT INTO passport_reviews (id,passport_id,reviewer_id,decision,note,created_at) SELECT ?,id,?,?,?,? FROM passports WHERE id=? AND updated_at=? AND review_status=?').bind(crypto.randomUUID(),user.userId,decision,note,now,body.id,now,decision)
  ]);
  if(!result[0].meta.changes)return json({error:'This passport changed. Refresh before reviewing it.'},409);
  return json({ok:true});
}
