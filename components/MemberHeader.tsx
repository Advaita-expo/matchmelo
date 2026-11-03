import Brand from './Brand';
import SignOutButton from './SignOutButton';
export default function MemberHeader({reviewer=false}:{reviewer?:boolean}){return <header className="account-header"><Brand/><nav aria-label="Member navigation"><a href="/discover">Discover</a><a href="/dates">Plan a date</a><a href="/passport">Digital Passport</a><a href="/profile">My profile</a><a href="/settings">Settings</a>{reviewer&&<a href="/review">Review queue</a>}<SignOutButton/></nav></header>;}
