import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { navigationFor } from '@/modules/identity/admin-navigation';
import type { StaffRole } from '@/modules/identity/roles';
import { signOut } from '../auth/actions';
import styles from './admin.module.css';
const groups = [{label:'Workspace',slugs:['overview']},{label:'Website',slugs:['content','reviews']},{label:'Tour operations',slugs:['departures']},{label:'Sales',slugs:['catalog','bookings']}];
export function AdminShell({operatorId,operatorName,role,section,children}:{operatorId:string;operatorName:string;role:StaffRole;section:string;children:ReactNode}) {
 const navigation=navigationFor(role);
 return <main className={styles.shell}>
  <a className={styles.skip} href="#workspace-content">Skip to content</a>
  <header className={styles.header}>
   <div className={styles.headerIdentity}>
   <Link className={styles.adminBrand} href={'/admin/'+operatorId+'/overview'}><Image src="/brand/logo-color.svg" alt="Sightseeing Shkodra" width={170} height={51} unoptimized priority/></Link>
   <div className={styles.workspaceIdentity}><strong>{operatorName}</strong><span>{role.replace('_',' ')}</span></div>
   </div>
   <div className={styles.headerActions}><Link className={styles.workspaceSwitch} href="/admin">Switch workspace</Link><form action={signOut}><Button className={styles.secondary}>Sign out</Button></form></div>
  </header>
  <div className={styles.workspace}>
   <nav className={styles.nav} aria-label="Admin navigation">{groups.map(group=>{
    const items=navigation.filter(item=>group.slugs.includes(item.slug));
    return items.length ? <div className={styles.navGroup} key={group.label}><span className={styles.navLabel}>{group.label}</span>{items.map(item=><Link key={item.slug} href={'/admin/'+operatorId+'/'+item.slug} aria-current={section===item.slug?'page':undefined}>{item.label}</Link>)}</div> : null;
   })}</nav>
   <div id="workspace-content" tabIndex={-1} className={styles.panel+' '+(section==='content'?styles.cmsPanel:'')}>{children}</div>
  </div>
 </main>;
}
