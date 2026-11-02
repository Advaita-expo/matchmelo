import {requireChatGPTUser,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {getPassport,publicPassport,isReviewer} from '@/lib/passports';
import PassportClient from './passport-client';
import Brand from '@/components/Brand';
export const dynamic='force-dynamic';
export const metadata={title:'Digital Passport | Matchmelo'};
export default async function PassportPage(){const user=await requireChatGPTUser('/passport');const p=await getPassport(user.userId);return <div className="account-site"><header className="account-header"><Brand/><nav aria-label="Member navigation"><a href="/">Home</a><a href="/passport" aria-current="page">Digital Passport</a><a href="/profile">My profile</a><a href="/discover">Explore preview ↗</a>{isReviewer(user)&&<a href="/review">Review queue</a>}<a href={chatGPTSignOutPath('/')} target="_top">Sign out</a></nav></header><PassportClient initialPassport={publicPassport(p)} account={{name:user.fullName||'',email:user.email}}/></div>;}
