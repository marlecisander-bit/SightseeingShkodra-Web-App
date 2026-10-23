'use client';
import Link,{useLinkStatus} from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {AdminIcon,adminPrimaryIcons} from './admin-icon';
import {activeAdminItem,adminContext,type AdminNavGroup} from '@/modules/identity/admin-navigation-layout';
import styles from './admin.module.css';

export function AdminNavigation({groups,section,account}:{groups:AdminNavGroup[];section:string;account:ReactNode}){
 const router=useRouter();
 const [context,setContext]=useState('');
 const [drawer,setDrawer]=useState<'bookings'|'tours'|'more'|null>(null);
 const dialog=useRef<HTMLDialogElement>(null), trigger=useRef<HTMLElement|null>(null);
 const active=activeAdminItem(groups,section,context);
 const area=groups.find(g=>g.items.some(i=>i.id===active?.id))?.id;
 function close(){dialog.current?.close();}
 useEffect(()=>{
  const sync=()=>{setContext(adminContext(window.location.hash));};
  sync();window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);window.addEventListener('admin:context-changed',sync);
  return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);window.removeEventListener('admin:context-changed',sync);};
 },[section]);
 useEffect(()=>{
  const desktop=window.matchMedia('(min-width:1024px)'),resize=()=>{if(desktop.matches)dialog.current?.close();};
  desktop.addEventListener('change',resize);return()=>desktop.removeEventListener('change',resize);
 },[]);
 useEffect(()=>{
  if(!drawer)return;
  const prior=document.body.style.overflow;document.body.style.overflow='hidden';
  // UI-only history entry: Back dismisses the task menu without leaving the page.
  const oldState=window.history.state;
  window.history.pushState({...oldState,adminTaskMenu:true},'');
  const pop=()=>{dialog.current?.close();};window.addEventListener('popstate',pop);
  return()=>{document.body.style.overflow=prior;window.removeEventListener('popstate',pop);};
 },[drawer]);
 function open(value:'bookings'|'tours'|'more',button:HTMLElement){
  trigger.current=button;setDrawer(value);dialog.current?.showModal();
 }
 function navigate(event:React.MouseEvent<HTMLAnchorElement>){
  const anchor=event.currentTarget;
  if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0||anchor.target==='_blank')return;
  const url=new URL(anchor.href);
  if(url.pathname===window.location.pathname&&url.hash.startsWith('#admin-nav=')){
   const change=new CustomEvent('admin:navigate-context',{cancelable:true,detail:adminContext(url.hash)});
   if(!window.dispatchEvent(change)){event.preventDefault();return;}
   event.preventDefault();const next=new URL(window.location.href);next.hash=url.hash;
   // Dismiss the temporary menu entry first, then navigate after popstate.
   const apply=()=>{window.history.pushState(window.history.state,'',next);window.dispatchEvent(new Event('admin:context-changed'));};
   if(window.history.state?.adminTaskMenu){window.addEventListener('popstate',apply,{once:true});close();}else apply();
  }else if(window.history.state?.adminTaskMenu&&anchor.target!=='_blank'){
   event.preventDefault();window.addEventListener('popstate',()=>router.push(url.pathname+url.search+url.hash),{once:true});close();
  }else close();
 }
 function items(group:AdminNavGroup){return <ul className={styles.taskItems}>{group.items.map(item=><li key={item.id}><Link prefetch={false} href={item.href} onClick={navigate} target={item.external?'_blank':undefined} rel={item.external?'noopener noreferrer':undefined} aria-current={active?.id===item.id?'page':undefined}><span>{item.label}{item.external&&<span aria-label=" (opens in a new tab)" className={styles.externalIcon}><AdminIcon name="external-link" size={16}/></span>}</span>{item.note&&<small>{item.note}</small>}<NavigationHint/></Link></li>)}</ul>;}
 const taskGroups=groups.filter(g=>drawer==='more'?['website','settings'].includes(g.id):g.id===drawer);
 return <>
  <aside className={styles.desktopNavigation}>
   <nav aria-label="Admin navigation" className={styles.taskNavigation}>{groups.map(group=><details className={styles.taskGroup} key={group.id+':'+(area===group.id)} open={area===group.id}>
    <summary><AdminIcon name={adminPrimaryIcons[group.id]}/><span>{group.label}</span><span className={styles.chevron}><AdminIcon name="chevron-down" size={16}/></span></summary>{items(group)}
   </details>)}</nav>
   <details className={styles.accountMenu}><summary>Account</summary>{account}</details>
  </aside>
  <nav className={styles.bottomNavigation} aria-label="Primary admin navigation">
   <Link prefetch={false} href={groups.find(g=>g.id==='overview')!.items[0].href} aria-current={area==='overview'?'page':undefined}><AdminIcon name="layout-dashboard"/><span>Home</span><NavigationHint/></Link>
   {groups.some(g=>g.id==='bookings')?<button type="button" aria-current={area==='bookings'?'page':undefined} aria-expanded={drawer==='bookings'} aria-controls="admin-task-menu" onClick={e=>open('bookings',e.currentTarget)}><AdminIcon name="calendar-check"/><span>Bookings</span></button>:<button type="button" disabled title="Bookings are not available to your role"><AdminIcon name="calendar-check"/><span>Bookings</span></button>}
   <button type="button" aria-current={area==='tours'?'page':undefined} aria-expanded={drawer==='tours'} aria-controls="admin-task-menu" onClick={e=>open('tours',e.currentTarget)}><AdminIcon name="bus-front"/><span>Tours</span></button>
   <button type="button" aria-current={area==='website'||area==='settings'?'page':undefined} aria-expanded={drawer==='more'} aria-controls="admin-task-menu" onClick={e=>open('more',e.currentTarget)}><AdminIcon name="users"/><span>More</span></button>
  </nav>
  <dialog ref={dialog} id="admin-task-menu" className={styles.mobileDrawer} aria-labelledby="admin-menu-title" onClick={e=>{if(e.target===e.currentTarget)close();}} onClose={()=>{
   if(window.history.state?.adminTaskMenu)window.history.back();setDrawer(null);trigger.current?.focus();
  }}>
   <div className={styles.drawerBody}><header className={styles.drawerHeading}><h2 id="admin-menu-title">{drawer==='more'?'More':drawer==='tours'?'Tours':'Bookings'}</h2><button type="button" onClick={close} aria-label="Close task menu"><AdminIcon name="x" size={18}/><span>Close</span></button></header>
   <nav aria-label="Admin task menu">{taskGroups.map(group=><section className={styles.mobileTaskGroup} key={group.id}><h3>{group.label}</h3>{items(group)}</section>)}</nav>
   {drawer==='more'&&<section className={styles.mobileTaskGroup}><h3>Account</h3>{account}</section>}</div>
  </dialog>
 </>;
}
export function AdminConnectionStatus(){
 const [offline,setOffline]=useState(false);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 return offline?<p className={styles.connectionNotice} role="alert">Connection lost. Some information may be out of date. Reconnect before saving.</p>:null;
}

export function AdminPageTrail({groups,section}:{groups:AdminNavGroup[];section:string}){
 const [context,setContext]=useState('');
 useEffect(()=>{const sync=()=>setContext(adminContext(window.location.hash));sync();window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);window.addEventListener('admin:context-changed',sync);return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);window.removeEventListener('admin:context-changed',sync);};},[section]);
 const item=activeAdminItem(groups,section,context),group=groups.find(g=>g.items.some(i=>i.id===item?.id));
 return <p className={styles.pageTrail} aria-label="Current location">{group?.label}{item&&<> / {item.label}</>}</p>;
}

function NavigationHint(){const {pending}=useLinkStatus();return <span className={styles.navigationHint} data-pending={pending} aria-hidden="true"/>;}
