'use client';
import {AdminWorkspaceIdentity} from './admin-workspace-context';
import {useEffect} from 'react';
import {installAdminNavigationGuard} from './admin-navigation-guard';
import {usePathname} from 'next/navigation';
import {NotificationProvider,NotificationBell} from './notifications';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import {adminNavigationGroups} from '@/modules/identity/admin-navigation-layout';
import {AdminNavigation,AdminConnectionStatus,AdminPageTrail} from './admin-navigation';
import {AdminIcon} from './admin-icon';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import type {ReactNode} from 'react';
import {signOut} from '../auth/actions';
import styles from './admin.module.css';
export function AdminShell({operatorId,operatorName,role,section,children,userId}:{operatorId:string;operatorName:string;role:StaffRole;section?:string;children:ReactNode;userId:string}){
 const pathname=usePathname();
 useEffect(()=>installAdminNavigationGuard(window),[pathname]);section=section??pathname.split('/')[3]??'overview';
 const groups=adminNavigationGroups(operatorId,role);
 const account=<div className={styles.accountActions}><p>{operatorName} / {role.replace('_',' ')}</p><a href="/" target="_blank" rel="noopener noreferrer">View website <AdminIcon name="external-link" size={16}/></a><Link prefetch={false} href="/admin">Switch workspace</Link><form action={signOut}><Button><AdminIcon name="log-out" size={18}/>Sign out</Button></form></div>;
 const body=<main className={styles.shell} data-admin-phase="navigation-a">
  <a className={styles.skip} href="#workspace-content">Skip to content</a>
  <header className={styles.header}><div className={styles.headerIdentity}><Link prefetch={false} className={styles.adminBrand} href={`/admin/${operatorId}/overview`}><Image src="/brand/logo-color.svg" alt="Sightseeing Shkodra" width={170} height={51} unoptimized priority/></Link><div className={styles.workspaceIdentity}><strong>{operatorName}</strong><span>{role.replace('_',' ')}</span></div></div><div className={styles.headerActions}>{hasPermission(role,'bookings.read')&&<NotificationBell key={pathname}/>}</div></header>
  <AdminConnectionStatus/><div className={styles.workspace}>
   <AdminNavigation groups={groups} section={section} account={account}/>
   <div id="workspace-content" tabIndex={-1} className={styles.panel+' '+(section==='content'?styles.cmsPanel:'')}><AdminPageTrail groups={groups} section={section}/>{children}</div>
  </div>
 </main>;
 return <AdminWorkspaceIdentity.Provider value={{operatorId,userId,role}}>{hasPermission(role,'bookings.read')?<NotificationProvider operator={operatorId} userId={userId}>{body}</NotificationProvider>:body}</AdminWorkspaceIdentity.Provider>;
}
