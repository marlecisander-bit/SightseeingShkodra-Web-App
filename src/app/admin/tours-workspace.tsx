import {type DepartureOffer} from '@/modules/dashboard/daily-departures';
import type {ReactNode} from 'react';
import Link from 'next/link';
import {AdminIcon} from './admin-icon';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import {DepartureAgenda,type PassengerList} from './departure-agenda';
import type {CalendarDay} from './operations-calendar';
import type {ServiceSchedule} from './schedule-editor';
import styles from './tours.module.css';
export type ToursView='today'|'agenda'|'calendar'|'prices'|'tickets';
export const toursView=(value?:string):ToursView=>['today','agenda','calendar','prices','tickets'].includes(value??'')?value as ToursView:'agenda';
export type ToursProjection={today:string;selected:string;timeZone:string;meeting?:string;products?:DepartureOffer[];calendars:{schedule:ServiceSchedule;title:string;days:CalendarDay[]}[]};
export function ToursWorkspace({operatorId,role,view,projection,children,error,selectedSchedule,selectedTime,walkIn,passengerList,checkInProgress,liveIssue}:{operatorId:string;role:StaffRole;view:ToursView;projection?:ToursProjection;children?:ReactNode;error?:string;selectedSchedule?:string;selectedTime?:string;walkIn?:boolean;passengerList?:PassengerList;checkInProgress?:(id:string)=>ReactNode;liveIssue?:ReactNode}){
 const root=`/admin/${encodeURIComponent(operatorId)}`,link=(mode:ToursView,date=projection?.selected)=>`${root}/departures?view=${mode}${date?'&date='+date:''}`;
 if(view==='today'||view==='agenda')return <DepartureAgenda operatorId={operatorId} role={role} view={view} projection={projection} error={error} selectedSchedule={selectedSchedule} selectedTime={selectedTime} walkIn={walkIn} passengerList={passengerList} checkInProgress={checkInProgress} liveIssue={liveIssue}/>;
 const tabs:[ToursView,string][]=[['agenda','Day agenda'],['calendar','Month planning']];
 return <div className={styles.tours} data-tours-workspace data-admin-context={view==='calendar'?'availability':view}>
  <header className={styles.header}><div><h1>{view==='calendar'?'Schedule':'Tour operations'}</h1><p>{view==='calendar'?'Month planning':view==='prices'?'Prices & offers':'Ticket settings'}</p></div><Link prefetch={false} className={styles.primary} href={link(view==='calendar'?'agenda':'calendar')}><AdminIcon name="calendar-days" size={18}/>{view==='calendar'?'Day agenda':'Open calendar'}</Link></header>
  <nav className={styles.tabs} aria-label="Tours workspace">{tabs.map(([mode,label])=><Link prefetch={false} href={link(mode)} key={mode} aria-current={view===mode?'page':undefined}>{label}</Link>)}</nav>
  {error&&<p role="alert" className={styles.note}>{error}</p>}
  {view==='prices'&&<><section className={styles.card}><h2>One place for passenger prices</h2><p>Standard adult, child and infant prices are managed in Products. Date-specific prices and fixed-price, percentage or amount offers use the same calendar’s selected-date controls. Saved reservations retain their agreed prices.</p><div className={styles.links}><Link prefetch={false} href={link('calendar')}>Date prices & offers <AdminIcon name="arrow-right" size={16}/></Link></div></section>{!hasPermission(role,'pricing.manage')&&<p role="note">This role can manage schedules. Pricing changes require existing commercial permissions.</p>}</>}
  {view==='tickets'&&<section className={styles.card}><h2>Tickets & products</h2><p>Manage ticket definitions, product publication, inclusions and supplier relationships in the existing product editor. Product details, passenger ages, prices and homepage cards are managed together in Products.</p>{hasPermission(role,'catalog.manage')?<Link prefetch={false} className={styles.textLink} href={`${root}/products`}>Open Products <AdminIcon name="arrow-right" size={16}/></Link>:<p>Product editing is unavailable for this role.</p>}</section>}
  {children}
 </div>;
}
