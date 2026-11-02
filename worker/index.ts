import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import * as passportApi from '../app/api/passport/route';
import * as selfieApi from '../app/api/passport/selfie/route';
import * as reviewApi from '../app/api/review/route';
import * as reviewSelfieApi from '../app/api/review/selfie/route';

const nativeApis:Record<string,Record<string,unknown>>={'/api/passport':passportApi,'/api/passport/selfie':selfieApi,'/api/review':reviewApi,'/api/review/selfie':reviewSelfieApi};

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const api=nativeApis[new URL(request.url).pathname.replace(/\/$/,'')];
    if(api){
      const method=api[request.method];
      if(typeof method!=='function')return new Response('Method not allowed',{status:405,headers:{'Cache-Control':'private, no-store'}});
      try{
        // Fully consume bounded incoming bodies before an API can reject them.
        // This also keeps request streams within their Worker event lifetime.
        let apiRequest=request;
        if(request.body){
          const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
          while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>4*1024*1024+20000){await reader.cancel();return Response.json({error:'That upload is too large.'},{status:413});}chunks.push(part.value);}
          const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
          apiRequest=new Request(request.url,{method:request.method,headers:request.headers,body:bytes});
        }
        return await method(apiRequest);
      }catch{return Response.json({error:'We could not complete that request. Please try again.'},{status:500,headers:{'Cache-Control':'private, no-store'}});}
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    const secured = new Response(response.body, response);
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (/^\/(api|passport|profile|review|discover|signin)(\/|$)/.test(new URL(request.url).pathname)) {
      secured.headers.set('Cache-Control', 'private, no-store');
    }
    return secured;
  },
};

export default worker;
