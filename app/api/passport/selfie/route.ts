export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import {stageUpload,deletionStatement,replacedSelfieStatement,commitUploadStatement,flushMediaDeletions} from '@/lib/media-cleanup';
import {getRequestUser} from '@/lib/passports';
import {bindings,getPassport,publicPassport,json} from '@/lib/passports';
import {MAX_SELFIE_BYTES,imageType,isSameOrigin} from '@/lib/passport-validation';
export async function GET(request:Request){
  const user=await getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);
  const p=await getPassport(user.userId);if(!p?.selfie_key)return json({error:'No selfie submitted.'},404);
  const image=await bindings().BUCKET.get(p.selfie_key);if(!image)return json({error:'Selfie not found.'},404);
  return new Response(image.body,{headers:{'Content-Type':image.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
}
export async function POST(request:Request){
  const user=await getRequestUser(request);if(!user)return json({error:'Please sign in again.'},401);
  if(!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  if(Number(request.headers.get('content-length')||0)>MAX_SELFIE_BYTES+20000)return json({error:'Choose a photo under 4 MB.'},413);
  const p=await getPassport(user.userId);if(!p)return json({error:'Save your introduction before submitting a selfie.'},409);
  let form:FormData;try{form=await request.formData();}catch{return json({error:'Choose a valid photo.'},400);}
  const challengeId=String(form.get('challengeId')||''),source=String(form.get('source')||'upload');
  const challenge=await bindings().DB.prepare('SELECT id FROM selfie_challenges WHERE id=? AND user_id=? AND used_at IS NULL AND expires_at>?').bind(challengeId,user.userId,new Date().toISOString()).first();if(!challenge||!['camera','upload'].includes(source))return json({error:'Request a fresh selfie challenge and try again.'},409);
  const photo=form.get('photo');if(form.get('consent')!=='yes')return json({error:'Consent is required to store your selfie for review.'},400);
  if(!(photo instanceof File)||photo.size<100||photo.size>MAX_SELFIE_BYTES)return json({error:'Choose a JPEG, PNG, or WebP photo under 4 MB.'},400);
  const bytes=new Uint8Array(await photo.arrayBuffer()),format=imageType(bytes);if(!format)return json({error:'Only JPEG, PNG, and WebP photos are accepted.'},400);
  const {DB,BUCKET}=bindings(),key=`passports/${user.userId}/${crypto.randomUUID()}.${format.extension}`,now=new Date().toISOString();
  await stageUpload(key);await BUCKET.put(key,bytes,{httpMetadata:{contentType:format.type}});
  try{const result=await DB.batch([
    DB.prepare('UPDATE selfie_challenges SET used_at=?,submission_id=? WHERE id=? AND user_id=? AND used_at IS NULL AND expires_at>?').bind(now,key,challengeId,user.userId,now),
    DB.prepare("UPDATE passports SET selfie_key=?,selfie_submitted_at=?,selfie_challenge_id=?,selfie_source=?,review_status='pending',review_note=NULL,reviewed_at=NULL,updated_at=? WHERE user_id=? AND updated_at=? AND EXISTS(SELECT 1 FROM auth_user u WHERE u.id=passports.user_id AND u.disabled=0) AND EXISTS(SELECT 1 FROM selfie_challenges WHERE id=? AND submission_id=?)").bind(key,now,challengeId,source,now,user.userId,p.updated_at,challengeId,key),
    commitUploadStatement(key),...(p.selfie_key?[replacedSelfieStatement(p.selfie_key,user.userId,key)]:[])
  ]);if(!result[1].meta.changes){await deletionStatement(key).run();await flushMediaDeletions();return json({error:'Your passport or challenge changed. Refresh and submit again.'},409);}}catch(error){await deletionStatement(key).run();await flushMediaDeletions();throw error;}
  await flushMediaDeletions();
  return json({passport:publicPassport(await getPassport(user.userId))});
}
export async function DELETE(request:Request){
  const user=await getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);
  if(!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  const p=await getPassport(user.userId);if(!p)return json({error:'Passport not found.'},404);
  const {DB,BUCKET}=bindings();
  const version=new Date().toISOString();const statements=[DB.prepare("UPDATE passports SET selfie_key=NULL,selfie_submitted_at=NULL,selfie_challenge_id=NULL,selfie_source=NULL,review_status='not_submitted',review_note=NULL,reviewed_at=NULL,updated_at=? WHERE user_id=? AND updated_at=?").bind(version,user.userId,p.updated_at)];
  if(p.selfie_key)statements.push(DB.prepare('INSERT INTO media_deletions (object_key,not_before,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM passports WHERE user_id=? AND selfie_key IS NULL AND updated_at=?) ON CONFLICT(object_key) DO UPDATE SET not_before=excluded.not_before').bind(p.selfie_key,version,version,user.userId,version));
  const result=await DB.batch(statements);if(!result[0].meta.changes)return json({error:'Your selfie changed. Refresh before removing it.'},409);
  await flushMediaDeletions();
  return json({passport:publicPassport(await getPassport(user.userId))});
}
