import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {getPassport} from '@/lib/passports';
import {redirect} from 'next/navigation';
import {shell} from './shell';
export const dynamic='force-dynamic';
export default async function DiscoverPage(){const user=await requireChatGPTUser('/discover');const p=await getPassport(user.userId);if(!p)redirect('/passport');return <><link rel="stylesheet" href="/legacy/styles.css"/><div id="member-context" hidden data-member-key={user.userId} data-profile={JSON.stringify({name:p.name,age:p.age,area:p.area,bio:p.bio,interests:JSON.parse(p.interests),adult:true})}/><div dangerouslySetInnerHTML={{__html:shell}}/><script type="module" src="/legacy/app.js"/></>;}
