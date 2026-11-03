import {env} from 'cloudflare:workers';
export type Runtime={DB:D1Database;BUCKET:R2Bucket;APP_URL:string;APP_ENV?:string;BETTER_AUTH_SECRET:string;REVIEWER_EMAIL?:string;REVIEWER_EMAILS?:string;RESEND_API_KEY?:string;EMAIL_FROM?:string;TURN_URLS?:string;TURN_SHARED_SECRET?:string;};
export const runtime=()=>env as unknown as Runtime;
export function appUrl(){const value=runtime().APP_URL;if(!value)throw new Error('APP_URL must be configured.');return new URL(value).origin;}
export function localOnly(request:Request){return runtime().APP_ENV==='development'&&['127.0.0.1','localhost','[::1]'].includes(new URL(request.url).hostname);}
