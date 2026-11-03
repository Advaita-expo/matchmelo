import {requireMember} from '@/lib/member';
import {isReviewer} from '@/lib/passports';
import MemberDashboard from '@/components/MemberDashboard';
export const dynamic='force-dynamic';
export const metadata={title:'Discover | Matchmelo'};
export default async function Page(){const user=await requireMember('/discover');return <MemberDashboard user={{id:user.userId,name:user.displayName,email:user.email}} reviewer={isReviewer(user)}/>;}
