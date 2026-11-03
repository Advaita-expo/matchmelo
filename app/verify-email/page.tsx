import AuthScreen from '@/components/AuthScreen';
export const dynamic='force-dynamic';
export const metadata={title:'Confirm your email | Matchmelo'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;return <AuthScreen mode="verify" email={q.email||''} token={q.token||''}/>;}
