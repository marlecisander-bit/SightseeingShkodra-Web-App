import Link from 'next/link';
import { navigationFor } from '@/modules/identity/admin-navigation';
import type { StaffRole } from '@/modules/identity/roles';
import styles from './admin.module.css';
const descriptions:Record<string,string>={reviews:'Manage genuine guest reviews, attribution and homepage display settings.',content:'Edit homepage sections, images, guides and SEO. Preview saved drafts before publishing.',catalog:'Manage experiences, publication status and suppliers.',departures:'Manage operating dates, departures, capacity, passenger categories and prices.',bookings:'Find reservations, create staff bookings and record payment at the meeting point.'};
export function OverviewPanel({operatorId,role}:{operatorId:string;role:StaffRole}) {
 const sections=navigationFor(role).filter(item=>item.slug!=='overview');
 return <><p className={styles.pageLead}>Choose a tool to manage your website and daily operations.</p>
 <div className={styles.overviewGrid}>{sections.map(item=><Link className={styles.toolCard} key={item.slug} href={'/admin/'+operatorId+'/'+item.slug}><h2>{item.label}</h2><p>{descriptions[item.slug]}</p><span>Open workspace </span></Link>)}</div>
 {!sections.length&&<p>No management tools are assigned to your role. Contact your operator administrator for access.</p>}
 <div className={styles.overviewNotes}><div><h2>Website and operations</h2><p>Manage schedules and passenger prices in Calendar & Pricing, and destinations and visitor information in Website content.</p></div><div><h2>Live map</h2><p>Routes, stops and GPS are managed in the independent live map app.</p><Link href="/live">View public live map</Link></div></div></>;
}
