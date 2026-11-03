import AuthScreen from '@/components/AuthScreen';
export const dynamic='force-dynamic';
export const metadata={title:'Reset password | Matchmelo'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;return <AuthScreen mode="forgot" email={q.email||''} token={q.token||''}/>;}
