export const POLICY_VERSION='2026-11-03';
export const MAX_SELFIE_BYTES=4*1024*1024;
export function validatePassport(input){
  if(!input||typeof input!=='object')throw new Error('Please complete your introduction.');
  const name=String(input.name||'').trim(),age=Number(input.age),city=String(input.city||'').trim(),area=String(input.area||'').trim(),intent=String(input.intent||''),bio=String(input.bio||'').trim();
  const interests=Array.isArray(input.interests)?[...new Set(input.interests.map(x=>String(x).trim()).filter(Boolean))]:[];
  if(name.length<2||name.length>35)throw new Error('Your first name should be 2–35 characters.');
  if(!Number.isInteger(age)||age<18||age>100)throw new Error('Matchmelo is for adults aged 18 and over.');
  if(city.length<2||city.length>60||area.length>60)throw new Error('Add your city and use at most 60 characters for each area.');
  if(!['A relationship','Open to exploring','Still figuring it out'].includes(intent))throw new Error('Choose what you’re looking for.');
  if(bio.length<20||bio.length>500)throw new Error('Your introduction should be 20–500 characters.');
  if(interests.length<2||interests.length>6||interests.some(x=>x.length>30))throw new Error('Choose 2–6 interests, up to 30 characters each.');
  if(input.adult!==true)throw new Error('Please confirm that you are at least 18.');
  if(input.policy!==true)throw new Error('Please read and accept the pilot terms and privacy notice.');
  return {name,age,city,area,intent,bio,interests};
}
export function imageType(bytes){
  if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return {type:'image/jpeg',extension:'jpg'};
  if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x))return {type:'image/png',extension:'png'};
  if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return {type:'image/webp',extension:'webp'};
  return null;
}
export function isSameOrigin(request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site';}
