import Link from 'next/link';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import {signOut} from '../auth/actions';
import {AdminIcon,type AdminIconName} from './admin-icon';
import styles from './more.module.css';
export function MorePanel({operatorId,role}:{operatorId:string;role:StaffRole}){
 const root=`/admin/${encodeURIComponent(operatorId)}`;
 function row(label:string,description:string,href:string,icon:AdminIconName,external=false){const copy=<><span className={styles.icon}><AdminIcon name={icon} size={20}/></span><span className={styles.copy}><strong>{label}</strong><small>{description}</small></span><AdminIcon name={external?'external-link':'chevron-right'} size={18}/></>;return <li key={label}>{external?<a href={href} target="_blank" rel="noopener noreferrer">{copy}</a>:<Link prefetch={false} href={href}>{copy}</Link>}</li>;}
 return <div className={styles.more} data-more-panel><header><p className={styles.eyebrow}>Your business workspace</p><h1>More</h1><p>Settings, communications and your account.</p></header>
 {hasPermission(role,'operator.manage')&&<section className={styles.group}><h2>Booking settings</h2><ul>{row('Booking meeting point','Boarding address and instructions.',`${root}/departures?view=calendar#booking-meeting-point`,'map-pin')}</ul></section>}
 {hasPermission(role,'bookings.read')&&<section className={styles.group}><h2>Notifications</h2><ul>{row('Booking alerts','Turn on alerts for this device.',`${root}/notifications`,'bell')}</ul></section>}
 {hasPermission(role,'integrations.manage')&&<section className={styles.group}><h2>Communications</h2><ul>{row('Booking email delivery','Delivery history, sender settings and troubleshooting.',`${root}/email`,'mail')}</ul></section>}
 <section className={styles.group}><h2>Account</h2><p>Current workspace role: {role.replaceAll('_',' ')}.</p><ul>{row('Switch workspace','Choose an existing workspace you can access.','/admin','users')}</ul><form action={signOut}><button type="submit"><AdminIcon name="log-out" size={18}/>Sign out</button></form></section>
 </div>;
}
