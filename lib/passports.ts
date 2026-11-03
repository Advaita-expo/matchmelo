import {env} from 'cloudflare:workers';
import {requestMember} from './auth';
import type {Member} from './auth';
import {runtime} from './runtime';
type Runtime={DB:D1Database;BUCKET:R2Bucket;REVIEWER_EMAIL?:string};
export const getRequestUser=requestMember;
export function bindings(){const runtime=env as unknown as Runtime;if(!runtime.DB||!runtime.BUCKET)throw new Error('Passport storage is unavailable.');return runtime;}
export type Passport={id:string;user_id:string;name:string;age:number;city:string;area:string;intent:string;bio:string;interests:string;adult_declared_at:string;policy_accepted_at:string;policy_version:string;selfie_key:string|null;selfie_submitted_at:string|null;selfie_challenge_id:string|null;selfie_source:string|null;review_status:string;review_note:string|null;reviewed_at:string|null;created_at:string;updated_at:string};
export function isReviewer(user:Member|null){const config=runtime(),emails=(config.REVIEWER_EMAILS||config.REVIEWER_EMAIL||'').split(',').map(x=>x.trim().toLowerCase());return !!user&&user.emailVerified&&emails.includes(user.email.toLowerCase());}
export async function getPassport(userId:string){return bindings().DB.prepare('SELECT * FROM passports WHERE user_id = ?').bind(userId).first<Passport>();}
export function publicPassport(p:Passport|null){if(!p)return null;const {user_id,selfie_key,...safe}=p;return {...safe,interests:JSON.parse(p.interests),has_selfie:!!selfie_key};}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
