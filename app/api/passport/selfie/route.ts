export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import {getRequestUser} from '@/lib/passports';
import {bindings,getPassport,publicPassport,json} from '@/lib/passports';
import {MAX_SELFIE_BYTES,imageType,isSameOrigin} from '@/lib/passport-validation';
export async function GET(request:Request){
  const user=getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);
  const p=await getPassport(user.userId);if(!p?.selfie_key)return json({error:'No selfie submitted.'},404);
  const image=await bindings().BUCKET.get(p.selfie_key);if(!image)return json({error:'Selfie not found.'},404);
  return new Response(image.body,{headers:{'Content-Type':image.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
}
export async function POST(request:Request){
  const user=getRequestUser(request);if(!user)return json({error:'Please sign in again.'},401);
  if(!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  if(Number(request.headers.get('content-length')||0)>MAX_SELFIE_BYTES+20000)return json({error:'Choose a photo under 4 MB.'},413);
  const p=await getPassport(user.userId);if(!p)return json({error:'Save your introduction before submitting a selfie.'},409);
  let form:FormData;try{form=await request.formData();}catch{return json({error:'Choose a valid photo.'},400);}
  const photo=form.get('photo');if(form.get('consent')!=='yes')return json({error:'Consent is required to store your selfie for review.'},400);
  if(!(photo instanceof File)||photo.size<100||photo.size>MAX_SELFIE_BYTES)return json({error:'Choose a JPEG, PNG, or WebP photo under 4 MB.'},400);
  const bytes=new Uint8Array(await photo.arrayBuffer()),format=imageType(bytes);if(!format)return json({error:'Only JPEG, PNG, and WebP photos are accepted.'},400);
  const {DB,BUCKET}=bindings(),key=`passports/${user.userId}/${crypto.randomUUID()}.${format.extension}`,now=new Date().toISOString();
  await BUCKET.put(key,bytes,{httpMetadata:{contentType:format.type}});
  try{const result=await DB.prepare("UPDATE passports SET selfie_key=?,selfie_submitted_at=?,review_status='pending',review_note=NULL,reviewed_at=NULL,updated_at=? WHERE user_id=? AND updated_at=?").bind(key,now,now,user.userId,p.updated_at).run();if(!result.meta.changes){await BUCKET.delete(key);return json({error:'Your passport changed. Refresh and submit the photo again.'},409);}}catch(error){await BUCKET.delete(key);throw error;}
  if(p.selfie_key)await BUCKET.delete(p.selfie_key);
  return json({passport:publicPassport(await getPassport(user.userId))});
}
export async function DELETE(request:Request){
  const user=getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);
  if(!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  const p=await getPassport(user.userId);if(!p)return json({error:'Passport not found.'},404);
  const {DB,BUCKET}=bindings();
  await DB.prepare("UPDATE passports SET selfie_key=NULL,selfie_submitted_at=NULL,review_status='not_submitted',review_note=NULL,reviewed_at=NULL,updated_at=? WHERE user_id=?").bind(new Date().toISOString(),user.userId).run();
  if(p.selfie_key)await BUCKET.delete(p.selfie_key);
  return json({passport:publicPassport(await getPassport(user.userId))});
}
