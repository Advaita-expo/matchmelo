import {requireMember} from '@/lib/member';
import MemberHeader from '@/components/MemberHeader';
import {bindings,isReviewer,publicPassport,Passport} from '@/lib/passports';
import {notFound} from 'next/navigation';
import Brand from '@/components/Brand';
import ReviewClient from './review-client';
import ModerationReports from './moderation-reports';
import {photos} from '@/lib/member-data';
export const dynamic='force-dynamic';
export const metadata={title:'Passport reviews | Matchmelo'};
export default async function ReviewPage(){const user=await requireMember('/review');if(!isReviewer(user))notFound();const result=await bindings().DB.prepare("SELECT * FROM passports WHERE review_status='pending' ORDER BY updated_at ASC LIMIT 50").all<Passport>();const items=await Promise.all(result.results.map(async p=>({...publicPassport(p)!,reviewPhotos:await photos(p.user_id),challengePrompt:p.selfie_challenge_id?(await bindings().DB.prepare('SELECT prompt FROM selfie_challenges WHERE id=?').bind(p.selfie_challenge_id).first<{prompt:string}>())?.prompt||null:null,source:p.selfie_source})));return <div><MemberHeader reviewer={isReviewer(user)}/><main className="section-width review-main"><span className="overline">AUTHORIZED REVIEWER ONLY</span><h1>A little care.<br/><em>A considered review.</em></h1><p>Review profile content and selfie consistency. Approval means “profile reviewed,” never verified age, identity, or liveness.</p><ReviewClient initialItems={items}/><ModerationReports/></main></div>;}
