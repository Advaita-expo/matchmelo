'use client';
import {useState} from 'react';
export default function SignOutButton(){const [busy,setBusy]=useState(false);return <button className="plain-signout" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch('/api/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.ok){window.location.assign('/signin');return;}}catch{}setBusy(false);}}>{busy?'Signing out…':'Sign out'}</button>;}
