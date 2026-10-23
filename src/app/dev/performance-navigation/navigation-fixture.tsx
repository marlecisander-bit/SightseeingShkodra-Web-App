"use client";
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {AdminNavigation} from '@/app/admin/admin-navigation';
import {AdminNavigation as BaselineNavigation} from './baseline-navigation';
import {adminNavigationGroups} from '@/modules/identity/admin-navigation-layout';
import styles from '@/app/admin/admin.module.css';
export function NavigationFixture({mode,children}:{mode:'before'|'after';children?:React.ReactNode}){
 const section=usePathname().split('/').at(-1)??'overview';const [instance,setInstance]=useState('loading');
 useEffect(()=>{const frame=requestAnimationFrame(()=>setInstance(crypto.randomUUID()));return()=>cancelAnimationFrame(frame);},[]);
 const groups=adminNavigationGroups('fixture','owner').map(g=>({...g,items:g.items.filter(i=>!i.external).map(i=>({...i,href:i.href.replace('/admin/fixture',`/dev/performance-navigation/${mode}`)}))}));
 const Navigation=mode==='before'?BaselineNavigation:AdminNavigation;
 return <main className={styles.shell}><header className={styles.header}><strong>Synthetic navigation benchmark</strong><output data-navigation-instance>{instance}</output></header><div className={styles.workspace}><Navigation groups={groups} section={section} account={<span>No account or data connection</span>}/><div id="workspace-content" className={styles.panel}>{children}<p>No Supabase, bookings, notifications, email or external map connections. Compare client navigation only; this is not a hosted admin performance result.</p></div></div></main>;
}
