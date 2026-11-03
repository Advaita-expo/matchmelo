import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {requestMember} from './auth';
import {appUrl} from './runtime';
export async function currentMember(){return requestMember(new Request(appUrl(),{headers:await headers()}));}
export async function requireMember(returnTo='/passport'){const user=await currentMember();if(!user)redirect('/signin?next='+encodeURIComponent(returnTo));return user;}
