import Link from 'next/link';
import {publicMapUrl} from '@/modules/tracking/public-map-binding';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import {AdminIcon,type AdminIconName} from './admin-icon';
import {DashboardNotifications,DashboardAttentionValue} from './notifications';
import styles from './dashboard.module.css';
import {DashboardFreshness} from './dashboard-freshness';
import {formatBookedEUR,type DailyBookings} from '@/modules/dashboard/daily-bookings';

/** Pure view: only complete authorized snapshots may replace unavailable values. */
export function OverviewPanel({operatorId,role,now=new Date(),snapshot,loading=false}:{operatorId:string;role:StaffRole;now?:Date;snapshot?:DailyBookings;loading?:boolean}){
 const timeZone=snapshot?.timeZone??'Europe/Tirane';
 const root=`/admin/${encodeURIComponent(operatorId)}`;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone,hour:'numeric',hourCycle:'h23'}).format(now));
 const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
 const date=new Intl.DateTimeFormat('en-GB',{timeZone,weekday:'long',day:'numeric',month:'long'}).format(now);
 const canBook=hasPermission(role,'bookings.read'),canSchedule=hasPermission(role,'departures.manage');
 const metrics:{label:string;icon:AdminIconName;hint:string;attention?:boolean;value?:string}[]=canBook?[
  {label:'Passengers today',icon:'users',hint:'Confirmed passengers',value:snapshot?.state==='ready'?String(snapshot.passengers):undefined},
  {label:'Booked revenue',icon:'tags',hint:'Booked, not collected',value:snapshot?.state==='ready'?formatBookedEUR(snapshot.bookedMinor!):undefined},
  ...(canSchedule?[{label:'Departures today',icon:'bus-front' as const,hint:'Schedule unavailable'}]:[]),
  {label:'Need attention',icon:'bell',hint:'Unread notifications',attention:true}
 ]:[];
 return <div className={styles.dashboard} data-dashboard>
  <header className={styles.greeting}><div><p className={styles.eyebrow}>Your day at a glance</p><h1>{greeting}, {role==='owner'?'owner':'team'}</h1><p className={styles.date}><AdminIcon name="calendar-days" size={16}/>{date}<span>{timeZone}</span></p></div></header>
  {!!metrics.length&&<><div className={styles.metrics}>{metrics.map(metric=><section className={styles.metric} key={metric.label} aria-label={metric.label}><div className={styles.metricHeading}><span className={styles.metricIcon}><AdminIcon name={metric.icon} size={18}/></span><h2>{metric.label}</h2></div>{metric.attention?<DashboardAttentionValue/>:<div className={styles.metricValue}><strong aria-label={metric.value??(loading&&metric.icon!=='bus-front'?'Loading':'Unavailable')}>{metric.value??'—'}</strong>{!metric.value&&<span>{loading&&metric.icon!=='bus-front'?'Loading…':'Unavailable'}</span>}</div>}<small>{metric.hint}</small></section>)}</div><p className={styles.dataNote}><AdminIcon name="info" size={16}/><span>{loading?'Loading daily totals…':snapshot?.state==='ready'?'Confirmed bookings for this service date. Departures remain unavailable.':'Complete daily totals are unavailable.'} Your unread count comes from notifications.</span></p></>}
  {canBook&&snapshot&&<DashboardFreshness snapshot={snapshot}/>}
  <div className={styles.columns}>
   {canSchedule&&<section className={`${styles.card} ${styles.departures}`}><div className={styles.cardTitle}><div><p className={styles.eyebrow}>Tour operations</p><h2>Today’s departures</h2></div><AdminIcon name="calendar-days"/></div>
    <div className={styles.timeline}><span className={styles.timelinePoint} aria-hidden="true"><AdminIcon name="clock-3" size={18}/></span><div className={styles.nextDeparture}><div className={styles.nextHeading}><h3>Next departure</h3><span className={styles.status}>Unavailable</span></div><p>Schedule summary unavailable</p></div></div>
    <Link prefetch={false} className={styles.textLink} href={`${root}/departures?date=${today}`}>Open today’s calendar <AdminIcon name="arrow-right" size={16}/></Link>
   </section>}
   {!canBook&&hasPermission(role,'content.manage')&&<section className={`${styles.card} ${styles.departures}`}><h2>Your website workspace</h2><p>Edit your page content and preview saved drafts. Publishing remains limited to authorized roles.</p><Link prefetch={false} className={styles.textLink} href={`${root}/content`}>Open page editor <AdminIcon name="arrow-right" size={16}/></Link></section>}
   {canBook&&<section className={`${styles.card} ${styles.attention}`}><div className={styles.cardTitle}><div><p className={styles.eyebrow}>Your notifications</p><h2>Operational attention</h2></div><AdminIcon name="bell"/></div><DashboardNotifications/><Link prefetch={false} className={styles.textLink} href={`${root}/notifications`}>All notifications <AdminIcon name="arrow-right" size={16}/></Link></section>}
   <section className={`${styles.card} ${styles.mapCard}`}><span className={styles.mapIcon}><AdminIcon name="map"/></span><div><h2>Live Map</h2><p>Vehicle status unavailable</p></div><Link prefetch={false} className={styles.mapLink} href={publicMapUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Live Map (opens in a new tab)"><span>Open Live Map</span><AdminIcon name="external-link" size={18}/></Link></section>
   <section className={styles.quickCard}><h2>Quick actions</h2><div className={styles.quickActions}>
    {hasPermission(role,'bookings.create')&&<Link prefetch={false} href={`${root}/bookings`} className={styles.primary}><AdminIcon name="ticket" size={18}/>New reservation</Link>}
    {canBook&&<Link prefetch={false} href={`${root}/bookings?date=${today}`}><AdminIcon name="calendar-check" size={18}/>Today’s bookings</Link>}
    <a href="/" target="_blank" rel="noopener noreferrer"><AdminIcon name="external-link" size={18}/>View website<span className={styles.sr}> (opens in a new tab)</span></a>
   </div></section>
  </div>
 </div>;
}
