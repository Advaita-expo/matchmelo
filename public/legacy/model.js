export const profiles = [
  {id:1,name:'Aarohi',age:25,area:'Bandra',city:'Mumbai',job:'Designer & weekend wanderer',interests:['Art & design','Slow Sundays','Coffee'],intent:'A relationship',bio:'Collecting little moments, big books, and questionable pottery. Looking for someone who makes ordinary Tuesdays feel special.',prompt:'The way to my heart is…',answer:'A really good coffee, a really bad joke, and a walk with no destination.',photo:1,reviewed:true},
  {id:2,name:'Ishita',age:24,area:'Andheri',city:'Mumbai',job:'Writer with a camera roll problem',interests:['Photography','Bookstores','Live music'],intent:'A relationship',bio:'Usually finding a new bookstore or a new excuse to go to the beach. Let’s trade playlists before we trade life stories.',prompt:'A perfect Sunday looks like…',answer:'A long breakfast that accidentally turns into an all-day adventure.',photo:2,reviewed:true},
  {id:3,name:'Riya',age:26,area:'Powai',city:'Mumbai',job:'Architect, amateur plant parent',interests:['Architecture','Cooking','Hiking'],intent:'Open to exploring',bio:'I design spaces for a living and spend the rest of my time finding new ones. Proud owner of three thriving plants and one very dramatic fern.',prompt:'Let’s skip small talk and…',answer:'Plan our dream tiny house in the mountains.',photo:3,reviewed:true},
  {id:4,name:'Ananya',age:23,area:'Dadar',city:'Mumbai',job:'Music lover & marketing human',interests:['Live music','Travel','Coffee'],intent:'A relationship',bio:'A playlist for every mood. Always up for a gig, a seaside walk, or an incredibly competitive board game.',prompt:'My most irrational opinion…',answer:'The journey playlist is just as important as the destination.',photo:4,reviewed:false},
  {id:5,name:'Sana',age:27,area:'Colaba',city:'Mumbai',job:'Chef in training, foodie forever',interests:['Cooking','Art & design','Travel'],intent:'A relationship',bio:'My love language is feeding people. Let’s find the best little restaurant neither of us has heard of yet.',prompt:'Together we could…',answer:'Cook a three-course meal and forget to take photos of any of it.',photo:5,reviewed:true},
  {id:6,name:'Tara',age:25,area:'Juhu',city:'Mumbai',job:'Ocean enthusiast & product thinker',interests:['Hiking','Photography','Slow Sundays'],intent:'Open to exploring',bio:'Equal parts ambitious and happy doing absolutely nothing by the sea. Tell me the last thing that made you laugh.',prompt:'A small thing I love…',answer:'When the sky turns peach and everyone pauses for a second.',photo:6,reviewed:true},
  {id:7,name:'Ayaan',age:26,area:'Bandra',city:'Mumbai',job:'Engineer with a soft spot for art',interests:['Coffee','Art & design','Bookstores'],intent:'A relationship',bio:'Building things, making coffee, getting lost in galleries. Here for a connection that feels easy and a conversation that goes somewhere.',prompt:'My ideal first date…',answer:'A tiny gallery, a big coffee, and zero interview questions.',photo:7,reviewed:true},
  {id:8,name:'Arjun',age:28,area:'Lower Parel',city:'Mumbai',job:'Filmmaker & Sunday cyclist',interests:['Photography','Travel','Live music'],intent:'A relationship',bio:'Finding stories in everyday places. I’ll probably notice the light before I notice the time.',prompt:'I’m happiest when…',answer:'The road is quiet, the weather is kind, and there is breakfast at the end.',photo:8,reviewed:false},
  {id:9,name:'Dev',age:24,area:'Versova',city:'Mumbai',job:'Illustrator, doodles on everything',interests:['Art & design','Cooking','Live music'],intent:'Open to exploring',bio:'Curious about everything. Currently learning to cook something beyond pasta, with very mixed results.',prompt:'Teach me something about…',answer:'The one hobby you could talk about for hours.',photo:9,reviewed:true},
  {id:10,name:'Rohan',age:27,area:'Thane',city:'Mumbai',job:'Consultant, full-time trail finder',interests:['Hiking','Coffee','Travel'],intent:'A relationship',bio:'Good shoes, good company, and an open weekend. Looking for someone to enjoy the little detours with.',prompt:'My green flag…',answer:'I remember how you take your coffee.',photo:10,reviewed:true},
  {id:11,name:'Meera',age:25,area:'Bandra',city:'Mumbai',job:'Book editor & sunset collector',interests:['Bookstores','Coffee','Art & design'],intent:'A relationship',bio:'One more chapter, one more coffee. Let’s have a conversation we don’t need to check our phones during.',prompt:'Let’s make a plan to…',answer:'Find the best bookshop in the city.',photo:2,reviewed:true},
  {id:12,name:'Kabir',age:27,area:'Powai',city:'Mumbai',job:'Researcher & home cook',interests:['Cooking','Hiking','Travel'],intent:'A relationship',bio:'Always asking why. Usually making enough food for six. Happy to share both the questions and the leftovers.',prompt:'A little joy in my day…',answer:'Getting a recipe right on the second try.',photo:7,reviewed:true},
];

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function freshState() {
  return {version:1,day:localDay(),acted:[],sent:[],incoming:[1,3,5,7],matches:[11,12],blocked:[],reports:[],messages:{11:[{from:'them',text:'Hey! Your bookstore recommendation sounds like my kind of weekend.',time:'10:24'}],12:[{from:'them',text:'Important question: mountains or the beach?',time:'09:41'}]},profile:{name:'You',age:25,area:'Bandra',bio:'',interests:['Coffee','Art & design','Travel'],adult:false},preferences:{min:22,max:32,area:'All areas',intent:'Any intention'},visibility:true,feedback:{}};
}
export function rollover(state, today=localDay()) {
  if(state.day !== today) { state.day=today; state.acted=[]; }
  return state;
}
export function availableProfiles(state) {
  if (!state.visibility) return [];
  return profiles.filter(p => p.id<=10 && !state.acted.includes(p.id) && !state.blocked.includes(p.id) && !state.matches.includes(p.id) && !state.sent.includes(p.id) && p.age>=state.preferences.min && p.age<=state.preferences.max && (state.preferences.area==='All areas'||p.area===state.preferences.area) && (state.preferences.intent==='Any intention'||p.intent===state.preferences.intent));
}
export function actOnProfile(state,id,action) {
  rollover(state);
  if(!['like','pass'].includes(action) || !availableProfiles(state).some(p=>p.id===id) || state.acted.length>=10) return {ok:false};
  state.acted.push(id);
  if(action==='like') {
    if(!state.sent.includes(id)) state.sent.push(id);
    if(state.incoming.includes(id)) {
      if(!state.matches.includes(id)) state.matches.push(id);
      state.incoming=state.incoming.filter(x=>x!==id);
      state.messages[id] ??= [];
      return {ok:true,matched:true};
    }
  }
  return {ok:true,matched:false};
}
export function blockProfile(state,id) {
  if(!state.blocked.includes(id)) state.blocked.push(id);
  state.matches=state.matches.filter(x=>x!==id);
  state.incoming=state.incoming.filter(x=>x!==id);
  state.sent=state.sent.filter(x=>x!==id);
  delete state.messages[id];
}
export function canMessage(state,id) { return state.matches.includes(id)&&!state.blocked.includes(id); }
export function likeIncoming(state,id) {
  if(!state.incoming.includes(id)||state.blocked.includes(id)) return false;
  if(!state.sent.includes(id)) state.sent.push(id);
  if(!state.matches.includes(id)) state.matches.push(id);
  state.incoming=state.incoming.filter(x=>x!==id);
  state.messages[id] ??= [];
  return true;
}
export function sendMessage(state,id,text) {
  const clean=String(text).trim().slice(0,2000);
  if(!clean||!canMessage(state,id)) return false;
  state.messages[id] ??= [];
  state.messages[id].push({from:'me',text:clean,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false})});
  return true;
}
