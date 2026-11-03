'use client';
// Session cookies authorize the request; this header only detects an account switch.
export async function memberFetch(userId:string,path:string,options:RequestInit={}){
  const headers=new Headers(options.headers);headers.set('X-Matchmelo-Member',userId);
  const response=await fetch(path,{...options,headers,credentials:'same-origin',cache:'no-store'});
  if(response.status===409){const data=await response.clone().json().catch(()=>null) as {code?:string}|null;if(data?.code==='ACCOUNT_CHANGED'){window.location.reload();throw new Error('Your signed-in account changed. Reloading your account.');}}
  return response;
}
