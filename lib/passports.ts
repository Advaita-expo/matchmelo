import {env} from 'cloudflare:workers';
import type {ChatGPTUser} from '@/app/chatgpt-auth';
type Runtime={DB:D1Database;BUCKET:R2Bucket;REVIEWER_EMAIL?:string};
// These identity headers are supplied by Sites dispatch, not by browser state.
export function getRequestUser(request:Request):ChatGPTUser|null{const userId=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');return userId&&email?{userId,email,displayName:email,fullName:null}:null;}
export function bindings(){const runtime=env as unknown as Runtime;if(!runtime.DB||!runtime.BUCKET)throw new Error('Passport storage is unavailable.');return runtime;}
export type Passport={id:string;user_id:string;name:string;age:number;city:string;area:string;intent:string;bio:string;interests:string;adult_declared_at:string;policy_accepted_at:string;policy_version:string;selfie_key:string|null;selfie_submitted_at:string|null;review_status:string;review_note:string|null;reviewed_at:string|null;created_at:string;updated_at:string};
export function isReviewer(user:ChatGPTUser|null){const configured=(env as unknown as Runtime).REVIEWER_EMAIL;return !!user&&!!configured&&user.email.toLowerCase()===configured.toLowerCase();}
export async function getPassport(userId:string){return bindings().DB.prepare('SELECT * FROM passports WHERE user_id = ?').bind(userId).first<Passport>();}
export function publicPassport(p:Passport|null){if(!p)return null;const {user_id,selfie_key,...safe}=p;return {...safe,interests:JSON.parse(p.interests),has_selfie:!!selfie_key};}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
