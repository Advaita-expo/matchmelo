export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import {getRequestUser} from '@/lib/passports';
import {bindings,isReviewer,json} from '@/lib/passports';
export async function GET(request:Request){
  const user=await getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);if(!isReviewer(user))return json({error:'Reviewer access is required.'},403);
  const id=new URL(request.url).searchParams.get('id');if(!id)return json({error:'Choose a passport.'},400);
  const {DB,BUCKET}=bindings();const row=await DB.prepare('SELECT selfie_key FROM passports WHERE id=?').bind(id).first<{selfie_key:string|null}>();
  if(!row?.selfie_key)return json({error:'Selfie not found.'},404);
  const object=await BUCKET.get(row.selfie_key);if(!object)return json({error:'Selfie not found.'},404);
  return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
