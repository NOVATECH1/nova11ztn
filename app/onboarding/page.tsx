"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage(){
  const router=useRouter();
  const [displayName,setDisplayName]=useState('');
  const [username,setUsername]=useState('');
  const [status,setStatus]=useState('');
  async function submit(){
    setStatus('Saving…');
    const r=await fetch('/api/onboarding/complete',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({displayName,username})});
    const d=await r.json();
    if(!r.ok){setStatus(d.error||'Unable to save profile.');return;}
    router.push('/');
  }
  return <div className="page"><div className="container"><div className="hero compact-hero"><div className="eyebrow">Welcome to ZTN</div><h1>Set up your profile</h1><p>Choose the public name and unique username people will see across ZTN. Your Google profile photo can be used automatically.</p></div><div className="card form-card"><div className="field"><label>Display name</label><input value={displayName} onChange={(e:any)=>setDisplayName(e.target.value)} placeholder="Your display name" maxLength={60}/></div><div className="field"><label>Username</label><input value={username} onChange={(e:any)=>setUsername(e.target.value)} placeholder="username" maxLength={30}/><p className="muted" style={{fontSize:12}}>Letters, numbers, underscore and dot only.</p></div><button className="btn btn-primary" onClick={submit}>Enter ZTN</button>{status&&<p className="muted" style={{marginTop:12}}>{status}</p>}</div></div></div>;
}
