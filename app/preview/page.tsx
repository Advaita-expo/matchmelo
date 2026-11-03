import PreviewAccount from './preview-account';
import MemberDashboard from '@/components/MemberDashboard';
import {previewUser} from '@/lib/preview-model';
export const metadata={title:'Interactive demo | Matchmelo',description:'Explore fictional Matchmelo profiles, preferences, matches, and messages. No real account or private selfie is needed.'};
export default async function Preview({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;return ['profile','passport','settings'].includes(q.view||'')?<PreviewAccount view={q.view!}/>:<MemberDashboard user={previewUser} reviewer={false} preview/>;}
