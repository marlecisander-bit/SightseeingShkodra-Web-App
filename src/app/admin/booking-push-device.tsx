'use client';
import styles from './notifications.module.css';
import {useCallback,useEffect,useRef,useState} from 'react';
import {adminWorkerPath,adminWorkerScope,deviceEnvironment,enableDevicePush,pushSupport,subscriptionMatchesKey,type RegisteredDevice} from '@/modules/notifications/push-registration';
import {PushRegistrationError} from '@/modules/notifications/registration-errors';
type Settings={automaticDelivery?:import('@/modules/notifications/delivery-health').DeliveryHealth;devices?:{id:string;enabled:boolean}[];preferences?:{type:string;in_app:boolean;push:boolean}[];publicKey:string;pushEnabled:boolean;configured:boolean;siteOrigin?:string;registrationEnabled?:boolean};
type Request=(query?:string,action?:unknown)=>Promise<unknown>;
export function BookingPushDevice({settings,request,onChanged}:{settings:Settings;request:Request;onChanged:()=>Promise<void>}){
 const [current,setCurrent]=useState<RegisteredDevice|null>(null),[permission,setPermission]=useState('Checking'),[problem,setProblem]=useState<string|null>(null),[message,setMessage]=useState(''),[errorCode,setErrorCode]=useState(''),[busy,setBusy]=useState(''),[origin,setOrigin]=useState(''),[checked,setChecked]=useState(false),[testSent,setTestSent]=useState(false);
 const generation=useRef(0),installedName=useRef('This device');
 const deviceRevision=settings.devices?.map(d=>d.id+':'+d.enabled).join(',')??'';
 const inspect=useCallback(async()=>{
  const turn=++generation.current,env=deviceEnvironment(),unsupported=pushSupport(env);
  installedName.current=env.ios?'iPhone or iPad':/Android/i.test(navigator.userAgent)?'Android device':'Computer browser';
  setOrigin(window.location.origin);setProblem(unsupported);setPermission('Notification' in window?Notification.permission:'Unsupported');
  let verified:RegisteredDevice|null=null,issue=unsupported;
  try{
   if(!unsupported&&Notification.permission==='granted'&&settings.publicKey){
    const registration=await navigator.serviceWorker.getRegistration(adminWorkerScope);
    const active=registration?.active?.scriptURL===new URL(adminWorkerPath,window.location.origin).href;
    const sub=active?await registration!.pushManager.getSubscription():null;
    if(sub){
     if(!subscriptionMatchesKey(sub,settings.publicKey))issue='KEY_CHANGED';
     else if(sub.expirationTime!==null&&sub.expirationTime<=Date.now())issue='EXPIRED';
     else{const saved=await request('',{kind:'device-status',endpoint:sub.endpoint}) as RegisteredDevice|null;if(saved?.enabled)verified=saved;else if(saved)issue='EXPIRED';}
    }
   }
   if(turn===generation.current){setCurrent(verified);setProblem(issue);setErrorCode('');}
   return verified;
  }catch(error){if(turn===generation.current){setCurrent(null);setErrorCode(error instanceof PushRegistrationError?error.code:'UNAVAILABLE');setMessage(error instanceof PushRegistrationError?error.message:'Could not check alerts. Try again.');}return null;
  }finally{if(turn===generation.current)setChecked(true);}
 },[request,settings.publicKey]);
 useEffect(()=>{
  const sequence=generation;
  const check=()=>{void inspect();};
  const visible=()=>{if(document.visibilityState==='visible')check();};check();window.addEventListener('focus',check);document.addEventListener('visibilitychange',visible);
  return()=>{sequence.current++;window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',visible);};
 },[inspect,deviceRevision]);
 async function enable(repair=false){
  setBusy('enable');setMessage('');setTestSent(false);
  try{
   await enableDevicePush({key:settings.publicKey,name:installedName.current,request,replace:repair||['DEVICE_ACCOUNT','SUBSCRIBE_FAILED','EXPIRED','KEY_CHANGED'].includes(errorCode||problem||'')});
   const verified=await inspect();if(!verified?.enabled)throw new PushRegistrationError('REGISTRATION_UNSAVED');await onChanged();setMessage('Alerts are set up on this device. Send a test to check.');
  }catch(error){setErrorCode(error instanceof PushRegistrationError?error.code:'UNAVAILABLE');setMessage(error instanceof PushRegistrationError?error.message:'Could not turn on alerts. Try again.');}
  finally{setBusy('');}
 }
 async function test(){
  if(!current)return;setBusy('test');setMessage('');setTestSent(false);
  try{
   const result=await request('',{kind:'test-push',id:current.id}) as {status:string;code:string};
   if(result.status==='accepted'){setTestSent(true);setMessage('Test sent. Did it appear on this device?');}
   else if(result.status==='expired'){setCurrent(null);setErrorCode('EXPIRED');setMessage('This device needs reconnecting. Tap Fix alerts.');}
   else setMessage(result.status==='uncertain'?'We could not confirm the test. Check this device before trying again.':'The test could not be sent. Try again in a minute.');
   await onChanged();
  }catch(error){const code=error instanceof PushRegistrationError?error.code:'UNAVAILABLE';setErrorCode(code);setMessage(error instanceof PushRegistrationError?error.message:'The test could not be sent. Try again.');}
  finally{setBusy('');}
 }
 async function disable(){
  if(!current)return;setBusy('disable');setMessage('');
  try{await request('',{kind:'device',id:current.id});const r=await navigator.serviceWorker.getRegistration(adminWorkerScope);await(await r?.pushManager.getSubscription())?.unsubscribe();setCurrent(null);setTestSent(false);await onChanged();setMessage('Alerts turned off on this device.');}
  catch{setMessage('Could not turn off alerts. Try again.');}finally{setBusy('');}
 }
 const wrongOrigin=Boolean(origin&&settings.siteOrigin&&origin!==settings.siteOrigin),registered=Boolean(current?.enabled&&permission==='granted');
 const delivery=settings.automaticDelivery??{state:settings.pushEnabled?'Needs attention':'Paused',reason:'Automatic sending could not be checked.'};
 const allOff=settings.preferences?.filter(p=>['booking_created','booking_modified','booking_cancelled'].includes(p.type)).every(p=>!p.push)===true;
 let action;
 if(!checked)action=<p role="status">Checking alerts…</p>;
 else if(wrongOrigin)action=<><p>Open your usual Admin address to enable alerts.</p><a className={styles.setupButton} href={`${settings.siteOrigin}/admin`}>Open Admin</a></>;
 else if(problem==='INSTALL_REQUIRED')action=<p>Tap Share → Add to Home Screen, keep Open as Web App on, then Add. Open the new icon to enable alerts.</p>;
 else if(problem==='UNSUPPORTED')action=<p>Alerts are unavailable in this browser. Use the installed iPhone app or a supported browser.</p>;
 else if(permission==='denied')action=<p>Allow Shkodra Admin in iPhone Settings → Notifications, then return here.</p>;
 else if(errorCode==='UNAUTHENTICATED')action=<><p>Sign in again to reconnect alerts.</p><a className={styles.setupButton} href={'/auth/sign-in?next='+encodeURIComponent(window.location.pathname+window.location.search)}>Sign in</a></>;
 else if(!settings.publicKey)action=<p>Alerts are temporarily unavailable. Your bookings are still saved.</p>;
 else if(!registered)action=<button className={styles.setupButton} type="button" disabled={!!busy} onClick={()=>void enable()}>{busy==='enable'?'Connecting…':errorCode||problem?'Fix alerts':'Enable booking alerts'}</button>;
 else action=<><p role="status"><strong>{allOff?'This device is ready — choose alerts below.':delivery.state==='Active'?'Booking alerts are on':'This device is ready'}</strong></p>{delivery.state!=='Active'&&<p>{delivery.state==='Paused'?'Automatic sending is paused.':'Automatic sending needs attention.'}</p>}<button className={styles.setupButton} type="button" disabled={!!busy||!settings.pushEnabled} onClick={()=>void test()}>{busy==='test'?'Sending…':'Send test alert'}</button></>;
 return <section className={styles.deviceSetup} aria-label="Booking alerts on this device"><h3>Booking alerts on this device</h3><p>New bookings, changes and cancellations.</p><div className={styles.setupAction}>{action}</div>{message&&<p role={errorCode?'alert':'status'} aria-live="polite">{message}</p>}{testSent&&<div className={styles.actions}><button type="button" onClick={()=>{setTestSent(false);setMessage('Test received on this device.');}}>Yes, received</button><button type="button" disabled={!!busy} onClick={()=>void enable(true)}>No — reconnect alerts</button></div>}
 <details><summary>Help with alerts</summary><p>If a test does not appear, check Lock Screen alerts and Focus in iPhone Settings.</p>{registered&&<div className={styles.actions}><button type="button" disabled={!!busy} onClick={()=>void enable(true)}>Reconnect this device</button><button type="button" disabled={!!busy} onClick={()=>void disable()}>Turn off on this device</button></div>}<small>{delivery.reason}{errorCode&&` Help code: ${errorCode}`}</small></details></section>;
}
