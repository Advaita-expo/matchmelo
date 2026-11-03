import {dayInZone,validatePreferences} from './core.js';
export const previewUser={id:'preview-you',name:'Demo You',email:'demo@matchmelo.invalid'};
export const previewPeople=Array.from({length:11},(_,index)=>({id:'preview-person-'+(index+1),name:'Demo '+String(index+1).padStart(2,'0'),age:24+index%5,city:'Mumbai',area:['Bandra','Andheri','Powai'][index%3],intent:'A relationship',bio:'[DEMO] A fictional profile for exploring Matchmelo. The supplied photo does not establish identity, age, or membership.',interests:['Coffee','Art','Hiking'],reviewStatus:'reviewed',gender:index<8?'woman':'man',photos:[{id:'preview-photo-'+(index+1),position:0,url:index<8?'/assets/girls-demo/portrait-'+String(index+1).padStart(2,'0')+'.png':'/assets/boy-demo-'+(index-7)+'.png'}]}));
const own=()=>({id:previewUser.id,name:previewUser.name,age:25,city:'Mumbai',area:'Bandra',intent:'A relationship',bio:'[DEMO] Your sample account has its own avatar. No real account or private selfie is created in this public preview.',interests:['Coffee','Art','Hiking'],reviewStatus:'reviewed',photos:[{id:'preview-own-photo',position:0,url:'/assets/demo-member-avatar.png'}]});
export function freshPreview(){return {version:1,day:dayInZone('Asia/Kolkata'),profile:own(),prefs:{user_id:previewUser.id,gender:'unspecified',interested_in:'["everyone"]',min_age:18,max_age:40,visibility:1,timezone:'Asia/Kolkata',city_only:1},acted:[],sent:[],incoming:['preview-person-2','preview-person-9'],matches:['preview-person-1'],blocked:[],messages:{'preview-person-1':[{id:'preview-welcome',sender_id:'preview-person-1',text:'[Demo message] A little hello! Explore this sample conversation. Messages here stay in your browser and are not sent to anyone.',created_at:'2026-11-03T06:00:00.000Z'}]}};}
const matchKey=id=>'preview-match-'+id;
const person=id=>previewPeople.find(p=>p.id===id);
export function runPreview(state,path,method='GET',data={}){
  const url=new URL(path,'https://preview.invalid/'),route=url.pathname.slice(1);
  const allowed=()=>previewPeople.filter(p=>!state.blocked.includes(p.id));
  if(route==='reset'){return {reset:true};}
  if(route==='bootstrap')return {development:true,user:previewUser,profile:state.profile,prefs:state.prefs,ready:true,photoCount:1,counts:{likes:state.incoming.filter(id=>!state.blocked.includes(id)&&!state.matches.includes(id)).length,matches:state.matches.length},invitations:[]};
  if(route==='preferences'){if(method==='POST'){const value=validatePreferences(data);state.prefs={...state.prefs,gender:value.gender,interested_in:JSON.stringify(value.interestedIn),min_age:value.minAge,max_age:value.maxAge,visibility:Number(value.visibility),timezone:value.timezone,city_only:Number(value.cityOnly)};}return {preferences:state.prefs};}
  if(route==='discover'){
    if(state.day!==dayInZone(state.prefs.timezone)){state.day=dayInZone(state.prefs.timezone);state.acted=[];}
    const interested=JSON.parse(state.prefs.interested_in);
    const profiles=allowed().filter(p=>!state.acted.includes(p.id)&&!state.sent.includes(p.id)&&!state.matches.includes(p.id)&&p.age>=state.prefs.min_age&&p.age<=state.prefs.max_age&&(interested.includes('everyone')||interested.includes(p.gender))).slice(0,Math.max(0,10-state.acted.length));
    return {profiles:state.prefs.visibility?profiles:[],remaining:Math.max(0,10-state.acted.length),total:10,paused:!state.prefs.visibility};
  }
  if(route==='likes')return {profiles:allowed().filter(p=>(url.searchParams.get('kind')==='sent'?state.sent:state.incoming).includes(p.id)&&!state.matches.includes(p.id))};
  if(route==='matches')return {matches:state.matches.filter(id=>!state.blocked.includes(id)&&person(id)).map(id=>({id:matchKey(id),createdAt:'2026-11-03T06:00:00.000Z',profile:person(id),lastMessage:(state.messages[id]||[]).at(-1)||null}))};
  if(route==='interest'){
    const target=data.targetId;
    if(target===previewUser.id)throw new Error('You cannot connect with your own profile.');
    if(data.action==='unmatch'){state.matches=state.matches.filter(id=>matchKey(id)!==data.matchId);return {ok:true};}
    if(!person(target)||state.blocked.includes(target))throw new Error('Choose an available demo profile.');
    if(data.action==='withdraw'){state.sent=state.sent.filter(id=>id!==target);return {ok:true};}
    if(!['like','pass'].includes(data.action))throw new Error('Choose like or pass.');
    if(data.source!=='incoming'&&!runPreview(state,'discover').profiles.some(p=>p.id===target))throw new Error('Choose someone from your daily introductions.');
    if(!state.acted.includes(target))state.acted.push(target);
    if(data.action==='like'){
      if(!state.sent.includes(target))state.sent.push(target);
      if(state.incoming.includes(target)){if(!state.matches.includes(target))state.matches.push(target);state.incoming=state.incoming.filter(id=>id!==target);state.messages[target]??=[];return {ok:true,matched:true,matchId:matchKey(target)};}
    }else state.incoming=state.incoming.filter(id=>id!==target);
    return {ok:true,matched:false};
  }
  if(route==='messages'){
    const id=state.matches.find(id=>matchKey(id)===(method==='GET'?url.searchParams.get('matchId'):data.matchId));
    if(!id||state.blocked.includes(id)||id===previewUser.id)throw new Error('That sample conversation is unavailable.');
    state.messages[id]??=[];
    if(method==='POST'){const text=String(data.text||'').trim().slice(0,2000);if(!text)throw new Error('Write a message first.');const existing=state.messages[id].find(message=>message.clientId===data.clientId);if(existing)return {message:existing};const message={id:'preview-'+data.clientId,sender_id:previewUser.id,text,created_at:new Date().toISOString(),clientId:data.clientId};state.messages[id].push(message);return {message};}
    return {messages:state.messages[id]};
  }
  if(route==='block'||route==='report'){const id=data.targetId;if(!person(id))throw new Error('Choose a demo profile.');if(!state.blocked.includes(id))state.blocked.push(id);state.matches=state.matches.filter(x=>x!==id);return {ok:true};}
  if(route==='blocks')return {blocks:state.blocked.map(id=>({target_id:id,name:person(id)?.name}))};
  if(route==='unblock'){state.blocked=state.blocked.filter(id=>id!==data.targetId);return {ok:true};}
  if(route==='calls'||route==='ice')throw new Error('Live calls are not connected in this public demo. The full app includes consented video calls after account setup.');
  throw new Error('This action is not available in the public demo.');
}
const storageKey='matchmelo-public-preview-v1';
export async function previewApi(path,method='GET',data={}){
  let state;try{state=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
  if(!state||state.version!==1||!state.profile||!state.prefs||!Array.isArray(state.matches))state=freshPreview();
  const response=path==='reset'?(state=freshPreview(),{ok:true}):runPreview(state,path,method,data);
  try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}
  return JSON.parse(JSON.stringify(response));
}
