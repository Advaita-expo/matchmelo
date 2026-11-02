export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import {getRequestUser} from '@/lib/passports';
import {bindings,getPassport,publicPassport,json} from '@/lib/passports';
import {validatePassport,isSameOrigin,POLICY_VERSION} from '@/lib/passport-validation';
export async function GET(request:Request){const user=getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);return json({passport:publicPassport(await getPassport(user.userId))});}
export async function POST(request:Request){
  const user=getRequestUser(request);if(!user)return json({error:'Please sign in again.'},401);
  if(!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  if(Number(request.headers.get('content-length')||0)>12000)return json({error:'Your introduction is too long.'},413);
  let values;try{values=validatePassport(await request.json());}catch(error){return json({error:error instanceof Error?error.message:'Check your introduction.'},400);}
  const previous=await getPassport(user.userId),now=new Date().toISOString();
  await bindings().DB.prepare(`INSERT INTO passports (id,user_id,name,age,city,area,intent,bio,interests,adult_declared_at,policy_accepted_at,policy_version,review_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,age=excluded.age,city=excluded.city,area=excluded.area,intent=excluded.intent,bio=excluded.bio,interests=excluded.interests,adult_declared_at=excluded.adult_declared_at,policy_accepted_at=excluded.policy_accepted_at,policy_version=excluded.policy_version,review_status=CASE WHEN passports.selfie_key IS NOT NULL THEN 'pending' ELSE 'not_submitted' END,review_note=NULL,reviewed_at=NULL,updated_at=excluded.updated_at`).bind(previous?.id||`MM-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`,user.userId,values.name,values.age,values.city,values.area,values.intent,values.bio,JSON.stringify(values.interests),previous?.adult_declared_at||now,now,POLICY_VERSION,'not_submitted',now,now).run();
  return json({passport:publicPassport(await getPassport(user.userId))});
}
export async function DELETE(request:Request){
  const user=getRequestUser(request);if(!user)return json({error:'Please sign in.'},401);
  if(!isSameOrigin(request))return json({error:'This request must come from Matchmelo.'},403);
  const p=await getPassport(user.userId);if(!p)return json({ok:true});
  const {DB,BUCKET}=bindings();
  await DB.batch([DB.prepare('DELETE FROM passport_reviews WHERE passport_id=?').bind(p.id),DB.prepare('DELETE FROM passports WHERE user_id=?').bind(user.userId)]);
  if(p.selfie_key)await BUCKET.delete(p.selfie_key);
  return json({ok:true});
}
