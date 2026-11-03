import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {drizzle} from 'drizzle-orm/d1';
import * as authSchema from '@/db/auth-schema';
import {runtime,appUrl} from './runtime';
import {sendAccountEmail} from './mail';
import {background,forwardSessionCookies,requestCache} from './lifecycle';
import {eraseMember} from './member-data';

export function auth(){
  const config=runtime();if(!config.BETTER_AUTH_SECRET||config.BETTER_AUTH_SECRET.length<32)throw new Error('A strong BETTER_AUTH_SECRET is required.');
  return betterAuth({
    appName:'Matchmelo',baseURL:appUrl(),secret:config.BETTER_AUTH_SECRET,
    database:drizzleAdapter(drizzle(config.DB),{provider:'sqlite',schema:authSchema,transaction:false}),
    trustedOrigins:[appUrl()],
    user:{additionalFields:{disabled:{type:'boolean',defaultValue:false,input:false}},deleteUser:{enabled:true,beforeDelete:async user=>{await config.DB.prepare('UPDATE auth_user SET disabled=1 WHERE id=?').bind(user.id).run();try{await eraseMember(user.id,true);}catch(error){await config.DB.prepare('UPDATE auth_user SET disabled=0 WHERE id=?').bind(user.id).run();throw error;}}}},
    emailAndPassword:{enabled:true,requireEmailVerification:true,autoSignIn:false,minPasswordLength:12,maxPasswordLength:128,revokeSessionsOnPasswordReset:true,sendResetPassword:async({user,url})=>{await background(()=>sendAccountEmail(user.email,'Reset your Matchmelo password',url));}},
    emailVerification:{sendOnSignUp:true,sendOnSignIn:false,autoSignInAfterVerification:false,expiresIn:3600,sendVerificationEmail:async({user,url})=>{await background(()=>sendAccountEmail(user.email,'Confirm your Matchmelo email',url));}},
    session:{expiresIn:60*60*24*7,updateAge:60*60*24,freshAge:60*5,cookieCache:{enabled:false}},
    rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:6},'/sign-up/email':{window:3600,max:5},'/request-password-reset':{window:3600,max:5},'/send-verification-email':{window:3600,max:5}}},
    advanced:{useSecureCookies:appUrl().startsWith('https:'),ipAddress:{ipAddressHeaders:['cf-connecting-ip']},defaultCookieAttributes:{httpOnly:true,sameSite:'lax',secure:appUrl().startsWith('https:')}},
    databaseHooks:{session:{create:{before:async session=>{const found=await config.DB.prepare('SELECT disabled FROM auth_user WHERE id=?').bind(session.userId).first<{disabled:number}>();return found?.disabled?false:{data:session};}}}},
  });
}
export type Member={userId:string;email:string;displayName:string;fullName:string|null;emailVerified:boolean;sessionId:string|null;};
export async function requestMember(request:Request):Promise<Member|null>{
  const context=requestCache();if(context?.member)return context.member as Promise<Member|null>;
  const resolve=async()=>{const result=await auth().api.getSession({headers:request.headers,returnHeaders:true});forwardSessionCookies(result.headers);const data=result.response;if(!data||!data.user.emailVerified||data.user.disabled)return null;return {userId:data.user.id,email:data.user.email,displayName:data.user.name,fullName:data.user.name,emailVerified:data.user.emailVerified,sessionId:data.session.id};};
  const promise=resolve();if(context)context.member=promise;return promise;
}
