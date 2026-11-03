'use client';
import {useEffect,useState} from 'react';
type Message={id:string;subject:string;link:string;created_at:string};
export default function LocalEmailPreview({email}:{email:string}){
  const [messages,setMessages]=useState<Message[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{setMessages([]);setError('');},[email]);
  async function load(){setBusy(true);setError('');try{const response=await fetch('/api/dev/mailbox?email='+encodeURIComponent(email),{cache:'no-store'});if(!response.ok)throw new Error('Local inbox is unavailable.');const data=await response.json() as {messages:Message[]};setMessages(data.messages);}catch(e){setError(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}}
  return <details className="local-email-preview"><summary>Local email preview</summary><p>Development only. Account emails are captured here instead of sent.</p><button className="button outline small" type="button" disabled={!email||busy} onClick={load}>{busy?'Checking…':'Refresh local inbox'}</button>{error&&<p role="alert">{error}</p>}<ul>{messages.map(message=><li key={message.id}><a href={message.link}>{message.subject} ↗</a><small>{new Date(message.created_at).toLocaleString()}</small></li>)}</ul></details>;
}
