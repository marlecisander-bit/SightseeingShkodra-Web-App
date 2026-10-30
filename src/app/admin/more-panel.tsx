import Link from 'next/link';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import {publicMapUrl} from '@/modules/tracking/public-map-binding';
import {signOut} from '../auth/actions';
import {AdminIcon,type AdminIconName} from './admin-icon';
import styles from './more.module.css';
export function MorePanel({operatorId,role}:{operatorId:string;role:StaffRole}){
 const root=`/admin/${encodeURIComponent(operatorId)}`;
 function row(label:string,description:string,href:string,icon:AdminIconName,external=false){const copy=<><span className={styles.icon}><AdminIcon name={icon} size={20}/></span><span className={styles.copy}><strong>{label}</strong><small>{description}</small></span><AdminIcon name={external?'external-link':'chevron-right'} size={18}/></>;return <li key={label}>{external?<a href={href} target="_blank" rel="noopener noreferrer">{copy}</a>:<Link prefetch={false} href={href}>{copy}</Link>}</li>;}
 return <div className={styles.more} data-more-panel><header><p className={styles.eyebrow}>Your business workspace</p><h1>More</h1><p>Settings, communications and your account.</p></header>
 {hasPermission(role,'content.sensitive')&&<section className={styles.group}><h2>Business</h2><ul>{row('Business profile & footer','Public business details, contact links and footer information.',`${root}/content#admin-nav=business`,'file-text')}{row('WhatsApp contact','Existing public number, message and visibility settings.',`${root}/content#admin-nav=whatsapp`,'info')}{hasPermission(role,'operator.manage')&&row('Booking meeting point','Boarding address and instructions.',`${root}/departures?view=calendar`,'map-pin')}</ul></section>}
 {hasPermission(role,'bookings.read')&&<section className={styles.group}><h2>Notifications</h2><ul>{row('Notification inbox','Read events and open their related bookings.',`${root}/notifications`,'bell')}{row('Preferences & devices','Personal event preferences and registered devices.',`${root}/notifications#notification-settings`,'users')}</ul><p>Personal notifications are separate from customer booking emails.</p></section>}
 {hasPermission(role,'integrations.manage')&&<section className={styles.group}><h2>Communications</h2><ul>{row('Booking email delivery','Delivery history, sender settings and troubleshooting.',`${root}/email`,'mail')}</ul></section>}
 {hasPermission(role,'tracking.manage')&&<section className={styles.group}><h2>Live tracking</h2><ul>{hasPermission(role,'tracking.manage')&&row('Independent Live Map','Vehicle position and operational stops. Opens in a new tab.',publicMapUrl,'map',true)}</ul></section>}
 <section className={styles.group}><h2>Account</h2><p>Current workspace role: {role.replaceAll('_',' ')}.</p><ul>{row('Switch workspace','Choose an existing workspace you can access.','/admin','users')}{row('View public website','Opens the public website in a new tab.','/','external-link',true)}</ul><form action={signOut}><button type="submit"><AdminIcon name="log-out" size={18}/>Sign out</button></form></section>
 </div>;
}
