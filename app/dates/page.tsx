import {currentMember} from '@/lib/member';
import {getPassport,isReviewer} from '@/lib/passports';
import MemberHeader from '@/components/MemberHeader';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import DatePlanner from './planner';
export const dynamic='force-dynamic';
export const metadata={title:'Plan a date | Matchmelo',description:'Find cafés, restaurants, desserts, and public places for a date with Google Maps. Explore clearly labeled demo couple offers.'};
export default async function Dates({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const query=await searchParams,user=await currentMember(),profile=user?await getPassport(user.userId):null;const requested=typeof query.place==='string'?query.place.trim().slice(0,120):'';const location=requested||[profile?.area,profile?.city].filter(Boolean).join(', ')||'Bandra, Mumbai';return <div>{user?<MemberHeader reviewer={isReviewer(user)}/>:<SiteHeader/>}<DatePlanner initialLocation={location}/><SiteFooter/></div>;}
