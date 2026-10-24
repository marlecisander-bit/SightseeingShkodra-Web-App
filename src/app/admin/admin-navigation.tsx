'use client';
import Link,{useLinkStatus} from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useEffect,useState,type ReactNode,type MouseEvent} from 'react';
import {AdminIcon,adminPrimaryIcons} from './admin-icon';
import {activeAdminItem,adminContext,type AdminNavGroup,type AdminNavItem} from '@/modules/identity/admin-navigation-layout';
import styles from './admin.module.css';

/** Same-page CMS contexts preserve the query and respect the existing dirty/pending guard. */
export function navigateAdminContext(event:MouseEvent<HTMLAnchorElement>){
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.currentTarget.target==='_blank')return;
 const url=new URL(event.currentTarget.href);
 if(url.search&&url.search!==window.location.search)return;
 if(url.pathname!==window.location.pathname||!url.hash.startsWith('#admin-nav='))return;
 event.preventDefault();
 if(!window.dispatchEvent(new CustomEvent('admin:navigate-context',{cancelable:true,detail:adminContext(url.hash)})))return;
 const next=new URL(window.location.href);next.hash=url.hash;
 window.history.pushState(window.history.state,'',next);
 window.dispatchEvent(new Event('admin:context-changed'));
}
function useContextHash(section:string){
 const [context,setContext]=useState('');const query=useSearchParams();
 useEffect(()=>{const sync=()=>setContext(adminContext(window.location.hash)||(section==='departures'?({today:'today',calendar:'availability',prices:'prices',route:'route',live:'live'}[query?.get('view')??'calendar']??'availability'):''));sync();
  window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);window.addEventListener('admin:context-changed',sync);
  return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);window.removeEventListener('admin:context-changed',sync);};
 },[section,query]);
 return context;
}
function TaskItems({items,activeId}:{items:AdminNavItem[];activeId?:string}){
 return <ul className={styles.taskItems}>{items.map(item=><li key={item.id}><Link prefetch={false} href={item.href} onClick={navigateAdminContext} target={item.external?'_blank':undefined} rel={item.external?'noopener noreferrer':undefined} aria-current={activeId===item.id?'page':undefined}><span>{item.label}{item.external&&<span aria-label=" (opens in a new tab)" className={styles.externalIcon}><AdminIcon name="external-link" size={16}/></span>}</span>{item.note&&<small>{item.note}</small>}<NavigationHint/></Link></li>)}</ul>;
}
export function AdminNavigation({groups,section,account}:{groups:AdminNavGroup[];section:string;account:ReactNode}){
 const context=useContextHash(section),active=activeAdminItem(groups,section,context);
 const area=groups.find(group=>group.items.some(item=>item.id===active?.id))?.id;
 return <>
  <aside className={styles.desktopNavigation}>
   <nav aria-label="Admin navigation" className={styles.taskNavigation}>{groups.map(group=><details className={styles.taskGroup} key={group.id+':'+(area===group.id)} open={area===group.id}>
    <summary><AdminIcon name={adminPrimaryIcons[group.id]}/><span>{group.label}</span><span className={styles.chevron}><AdminIcon name="chevron-down" size={16}/></span></summary>
    <TaskItems items={group.items} activeId={active?.id}/>
   </details>)}</nav>
   <details className={styles.accountMenu}><summary>Account</summary>{account}</details>
  </aside>
  <nav className={styles.bottomNavigation} aria-label="Primary admin navigation" style={{gridTemplateColumns:`repeat(${groups.length},minmax(0,1fr))`}}>
   {groups.map(group=><Link key={group.id} prefetch={false} href={group.items[0].href} onClick={navigateAdminContext} aria-current={area===group.id?'page':undefined}><span className={styles.primaryIcon}><AdminIcon name={adminPrimaryIcons[group.id]}/></span><span>{group.label}</span><NavigationHint/></Link>)}
  </nav>
 </>;
}
export function AdminConnectionStatus(){
 const [offline,setOffline]=useState(false);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 return offline?<p className={styles.connectionNotice} role="alert">Connection lost. Some information may be out of date. Reconnect before saving.</p>:null;
}
export function AdminPageTrail({groups,section}:{groups:AdminNavGroup[];section:string}){
 const context=useContextHash(section),item=activeAdminItem(groups,section,context),group=groups.find(g=>g.items.some(i=>i.id===item?.id));
 return <>
  <p className={styles.pageTrail} aria-label="Current location">{group?.label}{item&&group?.id!=='overview'&&<> / {item.label}</>}</p>
  {group&&group.items.length>1&&section!=='more'&&<details className={styles.sectionMenu} key={section}><summary>{group.label} tools <AdminIcon name="chevron-down" size={16}/></summary><nav aria-label={`${group.label} tools`}><TaskItems items={group.items} activeId={item?.id}/></nav></details>}
 </>;
}
function NavigationHint(){const {pending}=useLinkStatus();return <span className={styles.navigationHint} data-pending={pending} aria-hidden="true"/>;}
