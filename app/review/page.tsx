import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {bindings,isReviewer,publicPassport,Passport} from '@/lib/passports';
import {notFound} from 'next/navigation';
import Brand from '@/components/Brand';
import ReviewClient from './review-client';
export const dynamic='force-dynamic';
export const metadata={title:'Passport reviews | Matchmelo'};
export default async function ReviewPage(){const user=await requireChatGPTUser('/review');if(!isReviewer(user))notFound();const result=await bindings().DB.prepare("SELECT * FROM passports WHERE review_status='pending' ORDER BY updated_at ASC LIMIT 50").all<Passport>();return <div><header className="account-header"><Brand/><nav><a href="/passport">My Passport</a><a href="/">Home</a></nav></header><main className="section-width review-main"><span className="overline">AUTHORIZED REVIEWER ONLY</span><h1>A little care.<br/><em>A considered review.</em></h1><p>Review profile content and selfie consistency. Approval means “profile reviewed,” never verified age, identity, or liveness.</p><ReviewClient initialItems={result.results.map(p=>publicPassport(p)!)}/></main></div>;}
