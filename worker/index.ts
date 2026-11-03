import handler from 'vinext/server/fetch-handler';
import {runWithConnectorBinding} from '../lib/connector-context';
import type {ConnectorBinding} from '../lib/connector-contract.mjs';
import {withLifecycle,sessionCookies} from '../lib/lifecycle';
import {requestMember} from '../lib/auth';
import {maintenance} from '../lib/media-cleanup';
import {authHandler,securityApi} from '../lib/security-api';
import {handleMemberApi} from '../lib/member-api';
import * as passportApi from '../app/api/passport/route';
import * as selfieApi from '../app/api/passport/selfie/route';
import * as challengeApi from '../app/api/passport/challenge/route';
import * as reviewApi from '../app/api/review/route';
import * as reviewSelfieApi from '../app/api/review/selfie/route';
const apis:Record<string,Record<string,unknown>>={'/api/passport':passportApi,'/api/passport/selfie':selfieApi,'/api/passport/challenge':challengeApi,'/api/review':reviewApi,'/api/review/selfie':reviewSelfieApi};
const json=(error:string,status:number)=>Response.json({error},{status});
function secure(response:Response,request:Request){
  const result=new Response(response.body,response);const path=new URL(request.url).pathname;
  const originals=result.headers.getSetCookie();if(sessionCookies().length){result.headers.delete('Set-Cookie');for(const cookie of [...sessionCookies(),...originals])result.headers.append('Set-Cookie',cookie);}
  result.headers.set('X-Content-Type-Options','nosniff');result.headers.set('Referrer-Policy','strict-origin-when-cross-origin');result.headers.set('X-Frame-Options','DENY');result.headers.set('Permissions-Policy','camera=(self), microphone=(self), geolocation=()');
  if(path.startsWith('/api/')||/^\/(dates|passport|profile|settings|review|discover|signin|signup|forgot-password|reset-password|verify-email)(\/|$)/.test(path)||result.headers.has('set-cookie')){result.headers.set('Cache-Control','private, no-store');result.headers.set('Vary','Cookie');}
  if(new URL(request.url).protocol==='https:')result.headers.set('Strict-Transport-Security','max-age=31536000');
  return result;
}
async function buffered(request:Request){
  if(!request.body)return request;
  const media=/\/api\/(passport\/selfie|member\/photos)$/.test(new URL(request.url).pathname),max=media?4*1024*1024+20000:48*1024;
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw new Error('BODY_TOO_LARGE');}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return new Request(request.url,{method:request.method,headers:request.headers,body:bytes});
}
const worker={
  async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext<{CONNECTORS?:ConnectorBinding}>){return withLifecycle(ctx,async()=>{
    try{
      const path=new URL(request.url).pathname.replace(/\/$/,'');
      if(path.startsWith('/api/')){
        const incoming=await buffered(request);let response:Response;
        const expected=incoming.headers.get('X-Matchmelo-Member');
        if(expected){const member=await requestMember(incoming);if(!member)return secure(json('Please sign in.',401),request);if(member.userId!==expected)return secure(Response.json({error:'Your signed-in account changed. Reload this page.',code:'ACCOUNT_CHANGED'},{status:409}),request);}
        if(path.startsWith('/api/auth/'))response=await authHandler(incoming);
        else if(path.startsWith('/api/member/'))response=await handleMemberApi(incoming);
        else if(path.startsWith('/api/account/')||path.startsWith('/api/dev/')||path.startsWith('/api/moderation/'))response=await securityApi(incoming);
        else if(apis[path]){const method=apis[path][request.method];response=typeof method==='function'?await method(incoming):json('Method not allowed.',405);}
        else response=json('Endpoint not found.',404);
        return secure(response,request);
      }
      if(/^\/(dates|passport|profile|settings|review|discover|signin)(\/|$)/.test(path))await requestMember(request);
      let binding=ctx.props?.CONNECTORS;
      if(import.meta.env.DEV&&!binding&&env.CONNECTORS){const preview=env.CONNECTORS;binding={getContext:()=>preview.getContext?.()??Promise.resolve({status:'binding_unavailable'}),invoke:(connectorId,actionName,args)=>preview.invoke(connectorId,actionName,args)};}
      return secure(await runWithConnectorBinding(binding,()=>handler.fetch(request,env,ctx)),request);
    }catch(error){const oversized=error instanceof Error&&error.message==='BODY_TOO_LARGE';return secure(json(oversized?'That request is too large.':'We could not complete that request. Please try again.',oversized?413:500),request);}
  });},
  async scheduled(_controller:ScheduledController,_env:Cloudflare.Env,context:ExecutionContext){context.waitUntil(maintenance());},
};
export default worker;
