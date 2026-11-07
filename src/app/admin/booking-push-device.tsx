'use client';
import styles from './notifications.module.css';
import {useCallback,useEffect,useRef,useState} from 'react';
import {adminWorkerPath,adminWorkerScope,deviceEnvironment,enableDevicePush,pushSupport,subscriptionMatchesKey,type RegisteredDevice} from '@/modules/notifications/push-registration';
import {PushRegistrationError} from '@/modules/notifications/registration-errors';
type Settings={automaticDelivery?:import('@/modules/notifications/delivery-health').DeliveryHealth;devices?:{id:string;enabled:boolean}[];preferences?:{type:string;in_app:boolean;push:boolean}[];publicKey:string;pushEnabled:boolean;configured:boolean;siteOrigin?:string;registrationEnabled?:boolean};
type Request=(query?:string,action?:unknown)=>Promise<unknown>;
const bookingEvents=['booking_created','booking_modified','booking_cancelled'];
/** One next action; diagnostics and device maintenance stay outside normal setup. */
export function BookingPushDevice({settings,request,onChanged}:{settings:Settings;request:Request;onChanged:()=>Promise<void>}){
 const [current,setCurrent]=useState<RegisteredDevice|null>(null),[permission,setPermission]=useState('Checking'),[worker,setWorker]=useState('Checking'),[problem,setProblem]=useState<string|null>(null),[message,setMessage]=useState(''),[errorCode,setErrorCode]=useState(''),[busy,setBusy]=useState(false),[origin,setOrigin]=useState(''),[checked,setChecked]=useState(false);
 const generation=useRef(0),installedName=useRef('This device');
 const deviceRevision=settings.devices?.map(d=>d.id+':'+d.enabled).join(',')??'';
 const excludedEvents=settings.preferences?.filter(p=>bookingEvents.includes(p.type)&&!p.push).length??0;
 const inspect=useCallback(async()=>{
  const turn=++generation.current;setCurrent(null);setChecked(false);
  const env=deviceEnvironment();installedName.current=env.ios?'iPhone or iPad':/Android/i.test(navigator.userAgent)?'Android device':'Computer browser';
  setOrigin(location.origin);setProblem(pushSupport(env));setPermission('Notification' in window?Notification.permission:'Unsupported');
  try{
   if(pushSupport(env)){setWorker('Unavailable');return null;}
   const registration=await navigator.serviceWorker.getRegistration(adminWorkerScope);
   const active=registration?.active?.scriptURL===new URL(adminWorkerPath,location.origin).href;setWorker(active?'Active':'Not registered');
   const sub=active?await registration!.pushManager.getSubscription():null;
   if(!sub||Notification.permission!=='granted'||!settings.publicKey)return null;
   if(!subscriptionMatchesKey(sub,settings.publicKey)){setProblem('KEY_CHANGED');return null;}
   if(sub.expirationTime!==null&&sub.expirationTime<=Date.now()){setProblem('EXPIRED');return null;}
   const device=await request('',{kind:'device-status',endpoint:sub.endpoint}) as RegisteredDevice|null;
   if(turn!==generation.current)return null;
   const verified=device?.enabled===true?device:null;setCurrent(verified);return verified;
  }finally{if(turn===generation.current)setChecked(true);}
 },[request,settings.publicKey]);
 useEffect(()=>{
  let active=true;const sequence=generation;
  const check=()=>{void inspect().catch(error=>{if(active){setErrorCode(error instanceof PushRegistrationError?error.code:'UNAVAILABLE');setMessage(error instanceof PushRegistrationError?error.message:'Could not check this device. Check your connection and retry.');}});};
  const visible=()=>{if(document.visibilityState==='visible')check();};check();
  window.addEventListener('focus',check);document.addEventListener('visibilitychange',visible);
  return()=>{active=false;sequence.current++;window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',visible);};
 },[inspect,deviceRevision]);
 async function enable(forceReplace=false){
  setBusy(true);setMessage('');const replace=forceReplace||['DEVICE_ACCOUNT','SUBSCRIBE_FAILED'].includes(errorCode);setErrorCode('');
  try{
   await enableDevicePush({key:settings.publicKey,name:installedName.current,request,replace});
   const verified=await inspect();if(!verified?.enabled)throw new PushRegistrationError('REGISTRATION_UNSAVED');await onChanged();
  }catch(error){setErrorCode(error instanceof PushRegistrationError?error.code:'UNAVAILABLE');setMessage(error instanceof PushRegistrationError?error.message:'Registration did not finish. Check your connection and retry.');}
  finally{setBusy(false);}
 }
 async function test(){
  if(!current)return;setBusy(true);setMessage('');setErrorCode('');
  try{
   const result=await request('',{kind:'test-push',id:current.id}) as {status:string;code:string};
   setMessage(result.status==='accepted'?'Test alert accepted. Check this device; display and sound are not yet confirmed.':`The test alert was not accepted (${result.code}). Check device settings or contact the owner.`);
   await inspect();await onChanged();
  }catch(error){setMessage(error instanceof PushRegistrationError?error.message:'The test could not be sent. Wait one minute and try again.');}
  finally{setBusy(false);}
 }
 const wrongOrigin=Boolean(origin&&settings.siteOrigin&&origin!==settings.siteOrigin);
 const registered=Boolean(current?.enabled&&permission==='granted');
 const delivery=settings.automaticDelivery??{state:settings.pushEnabled?'Needs attention':'Paused',reason:'Worker health has not been verified.'};
 const diagnostic=<details><summary>Diagnostics &amp; device help</summary><p>{delivery.reason}</p><dl><dt>App origin</dt><dd>{origin||'Checking'}</dd><dt>Permission</dt><dd>{permission}</dd><dt>Service worker</dt><dd>{worker}</dd><dt>Subscription</dt><dd>{current?.enabled?'Registered on this device':'Not verified'}</dd><dt>Server configuration</dt><dd>{settings.configured?'Configured':'Missing or mismatched keys'}</dd><dt>Automatic delivery</dt><dd>{settings.pushEnabled?'Configured':'Paused or disabled'}</dd>{errorCode&&<><dt>Diagnostic code</dt><dd>{errorCode}</dd></>}</dl><p>Permissions and subscriptions do not transfer between .app, .com or www origins. When moving this phone from .app, disable its former registration in Other notification preferences and devices before enabling this installation to avoid duplicate alerts. Keep other phones enabled. Signing out does not revoke this device.</p>
 {delivery.lastSuccess&&<p>Last successful automatic run: {delivery.lastSuccess}</p>}{current?.enabled&&<button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await request('',{kind:'device',id:current.id});const r=await navigator.serviceWorker.getRegistration(adminWorkerScope);await(await r?.pushManager.getSubscription())?.unsubscribe();setCurrent(null);await onChanged();await inspect();setMessage('Booking alerts disabled on this device.');}catch{setCurrent(null);setMessage('Could not verify disabling. Refresh and check your devices.');}finally{setBusy(false);}}}>Disable alerts on this device</button>}{current?.enabled&&<button type="button" disabled={busy} onClick={()=>void enable(true)}>Repair registration</button>}</details>;
 let action;
 if(!checked)action=<p role="status">Checking this device…</p>;
 else if(wrongOrigin)action=<><p>Open Admin at the usual address to set up alerts. Your login and notification permission stay with that address.</p><a className={styles.setupButton} href={`${settings.siteOrigin}${location.pathname.startsWith('/admin')?location.pathname+location.search:'/admin'}`}>Open Admin</a></>;
 else if(problem==='INSTALL_REQUIRED')action=<p>On iPhone: Share → Add to Home Screen → open the installed app. Then return to this card. Requires iOS/iPadOS 16.4 or later.</p>;
 else if(problem==='UNSUPPORTED')action=<p>This browser does not support booking alerts. Open Admin in a supported browser or installed app over HTTPS.</p>;
 else if(permission==='denied')action=<p>Notifications are blocked. On iPhone, open Settings → Notifications → Shkodra Admin → Allow Notifications, then reopen this app. For other browsers, allow notifications in the site settings.</p>;
 else if(!settings.publicKey)action=<p>Booking alerts are not available yet. Ask the owner to check the notification configuration.</p>;
 else if(errorCode==='UNAUTHENTICATED')action=<><p>Your session expired. Sign in again to check this device.</p><a className={styles.setupButton} href={'/auth/sign-in?next='+encodeURIComponent(location.pathname+location.search)}>Sign in again</a></>;
 else if(errorCode)action=<><p role="alert">{message}</p><button className={styles.setupButton} type="button" disabled={busy} onClick={()=>void enable()}>Retry</button></>;
 else if(registered)action=<><p role="status">This device is registered</p><button className={styles.setupButton} type="button" disabled={busy} onClick={()=>void test()}>{busy?'Sending…':'Send test alert'}</button></>;

 else action=<button className={styles.setupButton} type="button" disabled={busy} onClick={()=>void enable()}>{busy?'Enabling…':'Enable booking alerts'}</button>;
 return <section className={styles.deviceSetup} aria-label="Booking alerts on this device"><h3>Booking alerts on this device</h3><p>Get alerts for new bookings, modifications and cancellations.</p><p><strong>Automatic booking alerts: {delivery.state}</strong></p><p>{delivery.state==='Active'?'Automatic sending is running. Test this phone to check receipt.':delivery.state==='Paused'?'Automatic sending is paused. You can still prepare this device.':'Automatic sending needs review. Open diagnostics or ask for support.'}</p>{excludedEvents>0&&<p>Your saved preferences exclude {excludedEvents} booking event {excludedEvents===1?'type':'types'}. Change them under Other notification preferences and devices.</p>}<div className={styles.setupAction}>{action}</div>{!errorCode&&message&&<p role="status" aria-live="polite">{message}</p>}{diagnostic}</section>;
}
