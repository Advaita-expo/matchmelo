import {currentMember} from '@/lib/member';
import {redirect} from 'next/navigation';
import {safeNext} from '@/lib/core';
import AuthScreen from '@/components/AuthScreen';
export const dynamic='force-dynamic';
export const metadata={title:'Sign in | Matchmelo'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;if(await currentMember())redirect(safeNext(q.next));return <AuthScreen mode="signin" next={safeNext(q.next)} verified={q.verified==='1'}/>;}
