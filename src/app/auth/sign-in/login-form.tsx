'use client';
import Link from 'next/link';
import {useRef,useState} from 'react';
import {useFormStatus} from 'react-dom';
import {Button} from '@/components/ui/button';
import {signIn} from '../actions';
import styles from './login.module.css';
function Icon({kind}:{kind:'email'|'lock'|'eye'}){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{kind==='email'?<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>:kind==='lock'?<><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg>}
function Submit(){const {pending}=useFormStatus();return <Button className={styles.submit} fullWidth disabled={pending} aria-busy={pending}>{pending?'Signing in...':'Sign in'}</Button>;}
export function LoginForm({error}:{error?:string}){
 const [visible,setVisible]=useState(false);const submitting=useRef(false);
 return <form className={styles.form} action={async data=>{try{await signIn(data);}finally{submitting.current=false;}}} onSubmit={event=>{if(submitting.current)event.preventDefault();else submitting.current=true;}}>
  {error&&<p className={styles.error} role="alert" id="login-error">{error}</p>}
  <label htmlFor="staff-email">Email</label><div className={styles.field}><Icon kind="email"/><input id="staff-email" name="email" type="email" autoComplete="email" placeholder="Enter your email" required maxLength={254} aria-describedby={error?'login-error':undefined}/></div>
  <label htmlFor="staff-password">Password</label><div className={styles.field}><Icon kind="lock"/><input id="staff-password" name="password" type={visible?'text':'password'} autoComplete="current-password" placeholder="Enter your password" required maxLength={1024} aria-describedby={error?'login-error':undefined}/><button type="button" className={styles.reveal} onClick={()=>setVisible(v=>!v)} aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} aria-controls="staff-password"><Icon kind="eye"/></button></div>
  <Link className={styles.forgot} href="/auth/forgot-password">Forgot password?</Link><Submit/>
 </form>;
}
