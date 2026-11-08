'use client';
import {BookingPushDevice} from './booking-push-device';
import {PushRegistrationError} from '@/modules/notifications/registration-errors';
import { createContext, useCallback, useContext, useEffect, useRef, useState, useId, type ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {recentNotifications,notificationSummary,notificationTime} from './notification-presentation';
import {AdminIcon} from './admin-icon';
import { bookingTarget, notificationLabels, type Device, type Inbox, type InboxItem, type Preference } from '@/modules/notifications/contracts';
import styles from './notifications.module.css';
type Context={loading?:boolean;operator:string;inbox:Inbox;error:string;connection:string;version:number;refresh:()=>Promise<void>;mutate:(action:unknown)=>Promise<unknown>;request:(query?:string,action?:unknown)=>Promise<unknown>};
export const NotificationContext=createContext<Context|null>(null);
const empty:Inbox={items:[],unread:0,next:null};
export async function notificationRequest(operator:string,query='',action?:unknown){
 const r=await fetch(`/api/admin/notifications?operator=${encodeURIComponent(operator)}${query}`,action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operator,action}),cache:'no-store',signal:AbortSignal.timeout(15000)}:{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!r.ok){const body=await r.json().catch(()=>null);throw new PushRegistrationError(typeof body?.code==='string'?body.code:'UNAVAILABLE');}return r.json();
}
export function NotificationProvider({operator,userId,children}:{operator:string;userId:string;children:ReactNode}){
 const [inbox,setInbox]=useState<Inbox>(empty),[error,setError]=useState(''),[connection,setConnection]=useState('Connecting'),[version,setVersion]=useState(0);
 const [loading,setLoading]=useState(true);
 const generation=useRef(0);
 const invalidate=useCallback(()=>{generation.current++;},[]);
 const request=useCallback((query='',action?:unknown)=>notificationRequest(operator,query,action),[operator]);
 const refresh=useCallback(async()=>{const g=++generation.current;try{const data=await notificationRequest(operator);if(g===generation.current){setInbox(data);setError('');setVersion(v=>v+1);}}catch{if(g===generation.current)setError('Notifications unavailable. Retry when connected.');}finally{if(g===generation.current)setLoading(false);}},[operator]);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;const queue=()=>{clearTimeout(timer);timer=setTimeout(()=>void refresh(),250);};
  const client=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const channel=client.channel(`admin-inbox:${operator}:${userId}`).on('postgres_changes',{event:'*',schema:'public',table:'admin_notification_receipts',filter:`user_id=eq.${userId}`},payload=>{if((payload.new as {operator_id?:string}).operator_id===operator)queue();}).subscribe(status=>{setConnection(status==='SUBSCRIBED'?'Live':status==='CHANNEL_ERROR'||status==='TIMED_OUT'?'Reconnecting':'Connecting');if(status==='SUBSCRIBED')queue();});
  const auth=client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){generation.current++;setInbox(empty);setConnection('Signed out');void client.removeChannel(channel);}});
  const visible=()=>{if(document.visibilityState==='visible')queue();};document.addEventListener('visibilitychange',visible);window.addEventListener('online',queue);queue();
  return()=>{invalidate();clearTimeout(timer);auth.data.subscription.unsubscribe();void client.removeChannel(channel);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',queue);};
 },[operator,userId,refresh,invalidate]);
 const mutate=async(action:unknown)=>{const result=await notificationRequest(operator,'',action);await refresh();return result;};
 return <NotificationContext.Provider value={{loading,operator,inbox,error,connection,version,refresh,mutate,request}}>{children}</NotificationContext.Provider>;
}
function useNotifications(){const c=useContext(NotificationContext);if(!c)throw Error('Notification workspace unavailable');return c;}
function NotificationTypeIcon({type}:{type:InboxItem['notification']['type']}){
 if(type==='booking_created')return <AdminIcon name="calendar-check"/>;
 if(type!=='booking_modified'&&type!=='booking_cancelled')return <AdminIcon name={type==='email_delivery_failed'?'mail':'info'}/>;
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M8 2v3M16 2v3M3 9h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>{type==='booking_cancelled'?<path d="m10 13 4 4m0-4-4 4"/>:<><circle cx="12" cy="15" r="3.5"/><path d="M12 13v2l1.5 1"/></>}</svg>;
}
function Item({item,onNavigate,compact=false}:{item:InboxItem;onNavigate?:()=>void;compact?:boolean}){
 const {operator,mutate}=useNotifications();const router=useRouter();const [error,setError]=useState(''),[busy,setBusy]=useState(false);const n=item.notification,view=notificationSummary(item);
 let target:string|null=null;try{target=bookingTarget(operator,n.booking_id);}catch{/* Missing destination remains a safe non-link. */}
 const content=<><span className={styles.itemIcon}><NotificationTypeIcon type={n.type}/>{!item.read_at&&<i aria-hidden="true"/>}</span><span className={styles.itemCopy}><strong>{n.title}</strong><span className={styles.summary}>{view.summary}</span>{view.reference&&<span className={styles.reference} title={view.reference}>{view.reference}{view.amount&&` · ${view.amount}`}</span>}<time dateTime={n.event_at} title={new Date(n.event_at).toLocaleString('en-GB',{timeZone:'Europe/Tirane'})}>{notificationTime(n.event_at)}</time><span className={styles.sr}>{item.read_at?'Read':'Unread'} notification</span></span><AdminIcon name="chevron-right" size={16}/></>;
 return <li className={`${styles.item} ${!item.read_at?styles.unread:''}`} aria-busy={busy}>
 {target?<Link className={styles.itemLink} prefetch={false} href={target} onClick={async event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();if(busy)return;setBusy(true);setError('');try{if(!item.read_at)await mutate({kind:'read',id:item.id,read:true});onNavigate?.();router.push(target!);}catch{setError('Unable to mark this notification read. Please try again.');}finally{setBusy(false);}}}>{content}</Link>:<div className={styles.itemLink}>{content}<span role="status">Booking destination unavailable.</span></div>}
 {!compact&&<button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await mutate({kind:'read',id:item.id,read:!item.read_at});setError('');}catch{setError('Unable to update read status.');}finally{setBusy(false);}}}>{item.read_at?'Mark unread':'Mark read'}</button>}{error&&<p className={styles.itemError} role="alert">{error}</p>}
 </li>;
}
export function NotificationBell(){
 const {operator,inbox,error,connection,refresh,mutate,loading}=useNotifications();const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
 const root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null),id=useId();
 const close=()=>{setOpen(false);button.current?.focus();};
 useEffect(()=>{if(!open)return;panel.current?.focus();const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);button.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};},[open]);
 const items=recentNotifications(inbox.items);
 return <div className={styles.bell} ref={root}><button className={styles.bellButton} data-unread={inbox.unread>0} type="button" ref={button} aria-label={`Notifications, ${inbox.unread} unread`} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><AdminIcon name="bell"/>{inbox.unread>0&&<span className={styles.badge} aria-hidden="true">{inbox.unread>9?'9+':inbox.unread}</span>}</button>
 {open&&<section ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-busy={busy||loading} id={id} className={styles.dropdown} aria-labelledby={id+'-title'} onKeyDown={event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const controls=Array.from(panel.current?.querySelectorAll<HTMLElement>('a,button:not(:disabled)')??[]);if(!controls.length)return;event.preventDefault();const index=controls.indexOf(document.activeElement as HTMLElement);const next=event.key==='Home'?0:event.key==='End'?controls.length-1:event.key==='ArrowDown'?(index+1)%controls.length:(index-1+controls.length)%controls.length;controls[next]?.focus();}}><header className={styles.panelHeader}><h2 id={id+'-title'}>Notifications</h2><button className={styles.markAll} type="button" disabled={!inbox.unread||busy} onClick={async()=>{setBusy(true);setActionError('');try{await mutate({kind:'read',id:'all',read:true});}catch{setActionError('Unable to mark notifications read. Please try again.');}finally{setBusy(false);}}}>{busy?'Updating…':'Mark all as read'}</button><button className={styles.closeButton} type="button" aria-label="Close notifications" onClick={close}><AdminIcon name="x" size={18}/></button></header>
 {(error||actionError)&&<p className={styles.panelError} role="alert">{actionError||error}{error&&<button type="button" onClick={()=>void refresh()}>Retry</button>}</p>}{loading&&!items.length?<p className={styles.empty} role="status">Loading notifications…</p>:!error&&!items.length?<div className={styles.empty}><AdminIcon name="bell"/><p>You&apos;re all caught up!</p></div>:<ul className={styles.list}>{items.map(item=><Item compact key={item.id} item={item} onNavigate={()=>setOpen(false)}/>)}</ul>}
 {connection==='Reconnecting'&&<p className={styles.connection} role="status">Reconnecting. Notifications may be delayed.</p>}{items.length>0&&<Link className={styles.viewAll} prefetch={false} href={`/admin/${operator}/notifications`} onClick={()=>setOpen(false)}>Alert settings <AdminIcon name="chevron-right" size={16}/></Link>}</section>}
 <span className={styles.sr} role="status" aria-live="polite">{inbox.unread} unread notifications</span></div>;
}
export function NotificationCenter(){
 const c=useNotifications();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const items=recentNotifications(c.inbox.items).slice(0,5);
 return <div className={styles.center}><NotificationSettings/><section className={styles.recent}><div className={styles.recentHeader}><h2>Recent alerts</h2><button type="button" disabled={busy||!items.length} onClick={async()=>{setBusy(true);setError('');try{await c.mutate({kind:'dismiss',before:new Date().toISOString()});}catch{setError('Could not clear alerts. Try again.');}finally{setBusy(false);}}}>{busy?'Clearing…':'Clear list'}</button></div><p>Latest five from the past week.</p>{(error||c.error)&&<p role="alert">{error||c.error} <button type="button" onClick={()=>void c.refresh()}>Retry</button></p>}{c.loading?<p role="status">Loading alerts…</p>:items.length?<ul className={styles.list}>{items.map(item=><Item compact key={item.id} item={item}/>)}</ul>:<p>You’re all caught up.</p>}</section></div>;
}
type Settings={automaticDelivery?:import('@/modules/notifications/delivery-health').DeliveryHealth;siteOrigin?:string;registrationEnabled?:boolean;canManageEmail:boolean;devices:Device[];preferences:Preference[];publicKey:string;workerEnabled:boolean;configured:boolean;pushEnabled:boolean;paused:boolean};
export function NotificationSettings(){
 const {operator,request}=useNotifications();
 const [settings,setSettings]=useState<Settings|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const loading=useRef<Promise<void>|null>(null);
 const load=useCallback(()=>{
  if(loading.current)return loading.current;
  const pending=request('&settings=1').then(data=>{setSettings(data as Settings);setMessage('');}).finally(()=>{loading.current=null;});loading.current=pending;return pending;
 },[request]);
 useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')void load().catch(()=>setMessage('Could not refresh alerts. Try again.'));};refresh();const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};},[load]);
 return <section id="notification-settings" className={styles.settings} aria-label="Alert settings">{!settings?<><p role="status">{message||'Checking alerts…'}</p>{message&&<button type="button" onClick={()=>void load().catch(()=>setMessage('Could not load alerts. Try again.'))}>Try again</button>}</>:<>
 <BookingPushDevice settings={settings} request={request} onChanged={load}/>
 <details><summary>Choose alerts</summary>{settings.preferences.filter(p=>['booking_created','booking_modified','booking_cancelled'].includes(p.type)).map(p=><label className={styles.preference} key={p.type}><span>{notificationLabels[p.type]}</span><input type="checkbox" checked={p.push} disabled={busy} onChange={async e=>{setBusy(true);try{await request('',{kind:'preference',...p,push:e.target.checked});await load();setMessage('Saved.');}catch{setMessage('Could not save. Try again.');}finally{setBusy(false);}}}/></label>)}</details>
 <details><summary>Other devices</summary>{!settings.devices.length?<p>No devices connected.</p>:<ul className={styles.list}>{settings.devices.map(d=><li key={d.id} className={styles.device}><span><strong>{d.device_name}</strong> · {d.enabled?'On':'Off'}</span>{d.enabled&&<button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await request('',{kind:'device',id:d.id});await load();setMessage('Device turned off.');}catch{setMessage('Could not turn off device.');}finally{setBusy(false);}}}>Turn off</button>}</li>)}</ul>}</details>
 {settings.canManageEmail&&<p><Link prefetch={false} href={`/admin/${operator}/email`}>Booking emails</Link></p>}{message&&<p role="status">{message}</p>}</>}
 </section>;
}

/** Dashboard consumes the same user/operator inbox projection; no extra request or delivery system. */
export function DashboardNotifications(){
 const context=useContext(NotificationContext);
 if(!context)return <p>Notifications are unavailable.</p>;
 const items=recentNotifications(context.inbox.items).slice(0,3);
 return <div className={styles.dashboardInbox} aria-busy={context.loading}>
  {context.error?<p role="alert">{context.error} <button type="button" onClick={()=>void context.refresh()}>Retry</button></p>
   :context.loading?<p role="status">Loading your notifications…</p>
   :<><p>{context.inbox.unread} unread {context.inbox.unread===1?'notification':'notifications'}</p>{items.length?<ul className={styles.list}>{items.map(item=><Item compact key={item.id} item={item}/>)}</ul>:<p>No notifications recorded for your account.</p>}</>}
  {context.connection==='Reconnecting'&&<p role="status">Reconnecting. Notifications may be delayed.</p>}
 </div>;
}

/** Presentation of the existing exact personal inbox count; no requests, state or new totals. */
export function DashboardAttentionValue(){
 const context=useContext(NotificationContext);
 const unavailable=!context||context.loading||!!context.error;
 return <div className={styles.attentionValue}><strong aria-label={unavailable?'Unavailable':`${context.inbox.unread} unread notifications`}>{unavailable?'—':context.inbox.unread}</strong><span>{unavailable?'Unavailable':'Unread'}</span></div>;
}
