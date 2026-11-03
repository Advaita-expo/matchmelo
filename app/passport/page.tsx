import {requireMember} from '@/lib/member';
import MemberHeader from '@/components/MemberHeader';
import {getPassport,publicPassport,isReviewer} from '@/lib/passports';
import {photos} from '@/lib/member-data';
import PassportClient from './passport-client';
import Brand from '@/components/Brand';
export const dynamic='force-dynamic';
export const metadata={title:'Digital Passport | Matchmelo'};
export default async function PassportPage(){const user=await requireMember('/passport');const p=await getPassport(user.userId);return <div className="account-site"><MemberHeader reviewer={isReviewer(user)}/><PassportClient initialPassport={publicPassport(p)} initialPhotoCount={(await photos(user.userId)).length} account={{id:user.userId,name:user.fullName||'',email:user.email}}/></div>;}
