import {requireMember} from '@/lib/member';
import {isReviewer} from '@/lib/passports';
import MemberHeader from '@/components/MemberHeader';
import SettingsClient from './settings-client';
export const dynamic='force-dynamic';
export const metadata={title:'Account settings | Matchmelo'};
export default async function Settings(){const user=await requireMember('/settings');return <div><MemberHeader reviewer={isReviewer(user)}/><SettingsClient user={{id:user.userId,email:user.email,name:user.displayName}}/></div>;}
