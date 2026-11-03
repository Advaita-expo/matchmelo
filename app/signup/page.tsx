import AuthScreen from '@/components/AuthScreen';
export const dynamic='force-dynamic';
export const metadata={title:'Create an account | Matchmelo'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;return <AuthScreen mode="signup" email={q.email||''} token={q.token||''}/>;}
