import {AsyncLocalStorage} from 'node:async_hooks';
type State={waitUntil:(promise:Promise<unknown>)=>void;cookies:string[];member?:Promise<unknown>};
const contexts=new AsyncLocalStorage<State>();
export function withLifecycle<T>(context:{waitUntil:(promise:Promise<unknown>)=>void},run:()=>T){return contexts.run({waitUntil:promise=>context.waitUntil(promise),cookies:[]},run);}
export function forwardSessionCookies(headers:Headers){const context=contexts.getStore();if(!context)return;for(const cookie of headers.getSetCookie())if(!context.cookies.includes(cookie))context.cookies.push(cookie);}
export function sessionCookies(){return contexts.getStore()?.cookies||[];}
export function requestCache(){return contexts.getStore();}
export async function background(task:()=>Promise<void>){const context=contexts.getStore();if(!context)return task();context.waitUntil(task().catch(()=>{console.error('account_email_delivery_failed');}));}
