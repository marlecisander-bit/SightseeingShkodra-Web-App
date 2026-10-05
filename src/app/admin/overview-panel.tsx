import Link from 'next/link';
import { navigationFor } from '@/modules/identity/admin-navigation';
import type { StaffRole } from '@/modules/identity/roles';
import styles from './admin.module.css';
const descriptions:Record<string,string>={notifications:'Check new bookings, booking changes and messages that need attention.',email:'Check booking messages, recent activity and email service status.',reviews:'Manage guest reviews and choose which appear on your homepage.',content:'Edit website text, images, guides and search listings. Preview saved drafts before publishing.',catalog:'Manage experiences, publication status and suppliers.',departures:'Manage operating dates, departures, seats, age groups and prices.',bookings:'Find reservations, create staff bookings and record payment at the meeting point.'};
export function OverviewPanel({operatorId,role}:{operatorId:string;role:StaffRole}) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tirane',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const order=['bookings','departures','notifications','content','catalog','reviews','email'];
 const sections=navigationFor(role).filter(item=>item.slug!=='overview').sort((a,b)=>order.indexOf(a.slug)-order.indexOf(b.slug));
 return <><p className={styles.pageLead}>Start with bookings and the calendar, then check your messages.</p>
 <section className={styles.todayActions}><h2>Today</h2><p>{new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Tirane',weekday:'long',day:'numeric',month:'long'}).format(new Date())}</p><div>{sections.filter(s=>['bookings','departures'].includes(s.slug)).map(s=><Link key={s.slug} href={'/admin/'+operatorId+'/'+s.slug+'?date='+today}>{s.slug==='bookings'?"Today's bookings":"Manage today"}</Link>)}</div></section><h2>Quick actions</h2><div className={styles.overviewGrid}>{sections.map(item=><Link className={styles.toolCard} key={item.slug} href={'/admin/'+operatorId+'/'+item.slug}><h2>{item.label}</h2><p>{descriptions[item.slug]}</p><span>Open {item.label}</span></Link>)}</div>
 {!sections.length&&<p>No management tools are assigned to your role. Contact your operator administrator for access.</p>}
 <div className={styles.overviewNotes}><div><h2>Website and operations</h2><p>Manage schedules and passenger prices in Calendar & Pricing, and destinations and visitor information in Website content.</p></div><div><h2>Live map</h2><p>View the live van service. Stops and vehicle information are managed in Live Map.</p><Link className={styles.liveAction} href="/live" target="_blank" rel="noopener noreferrer">Open Live Map</Link></div></div></>;
}
