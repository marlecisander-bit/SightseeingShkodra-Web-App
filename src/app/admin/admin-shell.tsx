import { NotificationProvider, NotificationBell } from './notifications';
import { hasPermission } from '@/modules/identity/roles';
import { AdminNavigation, AdminConnectionStatus } from './admin-navigation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { AmenityIcon } from '@/components/ui/amenity-icon';
import type { ReactNode } from 'react';
import { navigationFor } from '@/modules/identity/admin-navigation';
import type { StaffRole } from '@/modules/identity/roles';
import { signOut } from '../auth/actions';
import styles from './admin.module.css';
const groups = [{label:'Home',slugs:['overview']},{label:'Website',slugs:['content','reviews']},{label:'Tour operations',slugs:['departures']},{label:'Sales',slugs:['catalog','bookings']},{label:'Communication',slugs:['notifications','email']}];
export function AdminShell({operatorId,operatorName,role,section,children,userId}:{operatorId:string;operatorName:string;role:StaffRole;section:string;children:ReactNode;userId:string}) {
 const navigation=navigationFor(role);
 const menu = <nav className={styles.nav} aria-label="Admin navigation">{groups.map(group=>{
    const items=navigation.filter(item=>group.slugs.includes(item.slug)).sort((a,b)=>group.slugs.indexOf(a.slug)-group.slugs.indexOf(b.slug));
    return items.length ? <div className={styles.navGroup} key={group.label}><span className={styles.navLabel}>{group.label}</span>{items.map(item=><Link key={item.slug} href={'/admin/'+operatorId+'/'+item.slug} aria-current={section===item.slug?'page':undefined}><AmenityIcon name={item.slug==='departures'?'clock':item.slug==='bookings'?'ticket':item.slug==='catalog'?'van':item.slug==='reviews'?'people':'info'}/><span>{item.label}</span></Link>)}</div> : null;
   })}<div className={styles.navGroup}><span className={styles.navLabel}>Live service</span><Link href="/live" target="_blank" rel="noopener noreferrer"><AmenityIcon name="map"/><span>Open Live Map</span></Link></div><div className={styles.navGroup}><span className={styles.navLabel}>Account</span><Link href="/" target="_blank" rel="noopener noreferrer">View website</Link><Link href="/admin">Switch workspace</Link><span className={styles.accountLabel}>{operatorName} / {role.replace("_", " ")}</span><form action={signOut}><Button>Sign out</Button></form></div></nav>;
 const body = <main className={styles.shell}>
  <a className={styles.skip} href="#workspace-content">Skip to content</a>
  <header className={styles.header}>
   <div className={styles.headerIdentity}>
   <Link className={styles.adminBrand} href={'/admin/'+operatorId+'/overview'}><Image src="/brand/logo-light.svg" alt="Sightseeing Shkodra" width={170} height={51} unoptimized priority/></Link>
   <span className={styles.mobileTitle}>Admin</span><div className={styles.workspaceIdentity}><strong>{operatorName}</strong><span>{role.replace('_',' ')}</span></div>
   </div>
   <div className={styles.headerActions}><AdminNavigation>{menu}</AdminNavigation>{hasPermission(role,'bookings.read')&&<NotificationBell/>}<Link className={styles.websiteLink} href="/" target="_blank" rel="noopener noreferrer">View website</Link><Link className={styles.workspaceSwitch} href="/admin">Switch workspace</Link><form action={signOut}><Button className={styles.secondary}>Sign out</Button></form></div>
  </header>
  <AdminConnectionStatus/><div className={styles.workspace}>
   <aside className={styles.desktopNavigation}>{menu}</aside>
   <div id="workspace-content" tabIndex={-1} className={styles.panel+' '+(section==='content'?styles.cmsPanel:'')}>{children}</div>
  </div>
 </main>;
 return hasPermission(role,'bookings.read')?<NotificationProvider operator={operatorId} userId={userId}>{body}</NotificationProvider>:body;
}
