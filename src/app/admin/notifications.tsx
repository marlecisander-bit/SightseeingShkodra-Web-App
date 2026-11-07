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
 const r=await fetch(`/api/admin/notifications?operator=${encodeURIComponent(operator)}${query}`,action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operator,action}),cache:'no-store'}:{cache:'no-store'});
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
 {connection==='Reconnecting'&&<p className={styles.connection} role="status">Reconnecting. Notifications may be delayed.</p>}{items.length>0&&<Link className={styles.viewAll} prefetch={false} href={`/admin/${operator}/notifications`} onClick={()=>setOpen(false)}>View all notifications <AdminIcon name="chevron-right" size={16}/></Link>}</section>}
 <span className={styles.sr} role="status" aria-live="polite">{inbox.unread} unread notifications</span></div>;
}
export function NotificationCenter(){
 const c=useNotifications();const {request,version,inbox}=c;const [filter,setFilter]=useState('all'),[page,setPage]=useState<Inbox>(empty),[busy,setBusy]=useState(false),[error,setError]=useState('');const seq=useRef(0);const [allPages,setAllPages]=useState<{base:Inbox;page:Inbox}>();const view=filter==='all'?(allPages?.base===inbox?allPages.page:inbox):page;
 useEffect(()=>{let active=true;seq.current++;if(filter==='all')return;void request(`&filter=${filter}`).then(data=>{if(active){setPage(data as Inbox);setError('');}}).catch(()=>{if(active)setError('Unable to load notifications.');}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[request,version,filter,inbox]);
 return <div className={styles.center}><p>Operational alerts for this workspace. {c.connection}. <button onClick={()=>void c.refresh()}>Refresh</button></p><div className={styles.filters} role="group" aria-label="Filter notifications">{[['all','All'],['unread','Unread'],['booking_created','Bookings'],['booking_modified','Booking changes'],['booking_cancelled','Cancellations'],['system','Service updates']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>{setFilter(value);setError('');setBusy(false);}}>{label}</button>)}</div>
 <button disabled={!c.inbox.unread||busy} onClick={async()=>{setBusy(true);try{await c.mutate({kind:'read',id:'all',read:true});}catch{setError('Unable to mark notifications read.');}finally{setBusy(false);}}}>Mark all as read</button>
 {(error||c.error)&&<p role="alert">{error||c.error}</p>}<div aria-busy={busy}>{!view.items.length&&!busy?<p>No notifications in this view.</p>:<ul className={styles.list}>{view.items.map(item=><Item key={item.id} item={item}/>)}</ul>}</div>
 {view.next&&<button disabled={busy} onClick={async()=>{const id=seq.current;setBusy(true);try{const next=await c.request(`&filter=${filter}&cursor=${encodeURIComponent(view.next!)}`) as Inbox;if(seq.current===id){const combined={...next,items:[...view.items,...next.items.filter((x:InboxItem)=>!view.items.some(y=>y.id===x.id))]};if(filter==='all')setAllPages({base:inbox,page:combined});else setPage(combined);}}catch{setError('Unable to load more.');}finally{setBusy(false);}}}>Load more</button>}
 <NotificationSettings/></div>;
}
type Settings={automaticDelivery?:import('@/modules/notifications/delivery-health').DeliveryHealth;siteOrigin?:string;registrationEnabled?:boolean;history:{id:string;status:string;attempts:number;error_code:string|null;created_at:string;notification:{title:string;message:string}|null}[];canManageEmail:boolean;devices:Device[];preferences:Preference[];publicKey:string;workerEnabled:boolean;configured:boolean;pushEnabled:boolean;paused:boolean};
export function NotificationSettings(){
 const {operator,mutate,request}=useNotifications();
 const [settings,setSettings]=useState<Settings|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{setSettings(await request('&settings=1') as Settings);},[request]);
 useEffect(()=>{void Promise.resolve().then(load).catch(()=>setMessage('Notification settings unavailable. Reload and sign in again if needed.'));},[load]);
 return <section id="notification-settings" className={styles.settings}><h2>Booking notifications</h2>{!settings?<p>{message||'Loading settings...'}</p>:<>
 {settings.canManageEmail&&<p><Link prefetch={false} href={`/admin/${operator}/email`}>Email delivery status and settings</Link></p>}
 <BookingPushDevice settings={settings} request={request} onChanged={load}/>
 <details><summary>Other notification preferences and devices</summary>
 {settings.preferences.map(p=><fieldset key={p.type} disabled={busy}><legend>{notificationLabels[p.type]}</legend>{(['in_app','push'] as const).map(channel=><label key={channel}><input type="checkbox" checked={p[channel]} onChange={async e=>{setBusy(true);try{await mutate({kind:'preference',...p,[channel]:e.target.checked});await load();setMessage('Preference saved.');}catch{setMessage('Unable to save preference.');}finally{setBusy(false);}}}/>{channel==='in_app'?'In Admin':'Push on my devices'}</label>)}</fieldset>)}
 <h3>Your devices</h3><p>{!settings.devices.length?'No devices registered yet.':'Each device is managed separately.'}</p><ul className={styles.list}>{settings.devices.map(d=><li key={d.id} className={styles.device}><span><strong>{d.device_name}</strong> — {d.enabled?'Active':'Disabled'}{d.last_used_at&&<small>Last notification sent: {new Date(d.last_used_at).toLocaleString()}</small>}</span><div className={styles.actions}>{d.enabled&&<button disabled={busy} onClick={async()=>{setBusy(true);try{await mutate({kind:'device',id:d.id});await load();}catch{setMessage('Unable to disable device.');}finally{setBusy(false);}}}>Disable</button>}<button disabled={busy} onClick={async()=>{setBusy(true);try{await mutate({kind:'device',id:d.id,remove:true});await load();}catch{setMessage('Unable to remove device.');}finally{setBusy(false);}}}>Remove</button></div></li>)}</ul>
 <h3>Recent push deliveries to your devices</h3><p>Accepted means the push service accepted the message; device display is not confirmed.</p>{!settings.history?.length?<p>No push attempts recorded.</p>:<ul>{settings.history.map(row=><li key={row.id}><strong>{row.notification?.title}</strong> {row.notification?.message}<br/>{row.status} · {row.attempts} attempts · {new Date(row.created_at).toLocaleString()}{row.error_code&&` · ${row.error_code}`}</li>)}</ul>}<p role="status">{message}</p></details></>}
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
