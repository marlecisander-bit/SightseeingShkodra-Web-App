'use client';
import {AdminWorkspaceIdentity} from './admin-workspace-context';
import {useEffect} from 'react';
import {installAdminNavigationGuard} from './admin-navigation-guard';
import {usePathname} from 'next/navigation';
import {NotificationProvider,NotificationBell} from './notifications';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import {adminSections} from '@/modules/identity/admin-navigation';
import {adminNavigationGroups,type AdminNavGroup} from '@/modules/identity/admin-navigation-layout';
import {AdminNavigation,AdminConnectionStatus,AdminPageTrail} from './admin-navigation';
import {AdminIcon} from './admin-icon';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import type {ReactNode} from 'react';
import {signOut} from '../auth/actions';
import styles from './admin.module.css';
type ShellProps={operatorId:string;operatorName:string;role:StaffRole;section?:string;children:ReactNode;userId:string};
/** Authenticated layouts supply verified identity. The view itself grants no access. */
export function AdminShell(props:ShellProps){
 const view=<AdminShellView {...props}/>;
 return hasPermission(props.role,'bookings.read')?<NotificationProvider operator={props.operatorId} userId={props.userId}>{view}</NotificationProvider>:view;
}
/** Shared chrome, also exercised by a development-only, credential-free visual fixture. */
export function AdminShellView({operatorId,operatorName,role,section:requestedSection,children,userId,navigation,accountActions}:{operatorId:string;operatorName:string;role:StaffRole;section?:string;children:ReactNode;userId:string;navigation?:AdminNavGroup[];accountActions?:ReactNode}){
 const pathname=usePathname();
 useEffect(()=>installAdminNavigationGuard(window),[pathname]);
 const routeSection=requestedSection??pathname.split('/')[3]??'overview';
 const section=routeSection==='product-cards'?'products':routeSection;
 const groups=navigation??adminNavigationGroups(operatorId,role);
 const title=adminSections.find(item=>item.slug===section)?.label??'Workspace';
 const account=accountActions??<div className={styles.accountActions}><p>{operatorName} / {role.replace('_',' ')}</p><a href="/" target="_blank" rel="noopener noreferrer">View website <AdminIcon name="external-link" size={16}/></a><Link prefetch={false} href="/admin">Switch workspace</Link><form action={signOut}><Button><AdminIcon name="log-out" size={18}/>Sign out</Button></form></div>;
 const body=<div className={styles.shell} data-admin-phase="v2-phase-1">
  <a className={styles.skip} href="#workspace-content">Skip to content</a>
  <header className={styles.header}><div className={styles.headerIdentity}><Link prefetch={false} className={styles.adminBrand} href={`/admin/${operatorId}/overview`}><span className={styles.brandVan}><AdminIcon name="bus-front"/></span><Image src="/brand/logo-color.svg" alt="Sightseeing Shkodra" width={170} height={51} unoptimized priority/></Link><div className={styles.workspaceIdentity}><strong>{title}</strong><span>{operatorName}</span></div></div><div className={styles.headerActions}>{hasPermission(role,'bookings.read')&&<NotificationBell key={pathname}/>}<Link prefetch={false} className={styles.profileAccess} href={`/admin/${operatorId}/more`} aria-label={`Account and settings (${role.replace('_',' ')})`}><AdminIcon name="users"/><span>{role.replace('_',' ')}</span></Link></div></header>
  <AdminConnectionStatus/><div className={styles.workspace}>
   <AdminNavigation groups={groups} section={section} account={account}/>
   <main id="workspace-content" tabIndex={-1} className={styles.panel+' '+(section==='content'?styles.cmsPanel:'')}><AdminPageTrail groups={groups} section={section}/>{children}</main>
  </div>
 </div>;
 return <AdminWorkspaceIdentity.Provider value={{operatorId,userId,role}}>{body}</AdminWorkspaceIdentity.Provider>;
}
