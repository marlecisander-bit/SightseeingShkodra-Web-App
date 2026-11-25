import Link from 'next/link';
import Form from 'next/form';
import {hasPermission, type StaffRole} from '@/modules/identity/roles';
import {activeScheduleOffers, operatingSlots} from '@/modules/dashboard/daily-departures';
import type {ToursProjection} from './tours-workspace';
import {AdminIcon} from './admin-icon';
import type {ReactNode} from 'react';
import styles from './departure-agenda.module.css';

export type PassengerList = (input:{date:string;departure?:string;product?:string;create?:string;returnTo:string;time:string;inventory:string;alternatives:string[]})=>ReactNode;

export function DepartureAgenda({operatorId,role,view,projection,error,selectedSchedule,selectedTime,walkIn,passengerList,checkInProgress,liveIssue}: {
 operatorId:string;role:StaffRole;view:'today'|'agenda';projection?:ToursProjection;error?:string;
 selectedSchedule?:string;selectedTime?:string;walkIn?:boolean;passengerList?:PassengerList;checkInProgress?:(id:string)=>ReactNode;liveIssue?:ReactNode;
}) {
 const root=`/admin/${encodeURIComponent(operatorId)}`;
 const scheduleUrl=`${root}/departures`;
 const heading=view==='today'?'Today':'Schedule';
 if (!projection) return <section className={styles.agenda}><h1>{heading}</h1><p role="alert">{error ?? 'Departure data is unavailable.'}</p></section>;
 const {selected,today,timeZone,meeting}=projection;
 const localTime=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
 const dateLabel=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(selected));
 const schedules=projection.calendars.flatMap(calendar=>{
  const offers=activeScheduleOffers(calendar.schedule.product_id,projection.products??[]);
  return calendar.schedule.status==='active'&&offers.length?[{...calendar,offers}]:[];
 });
 const scope=schedules.find(c=>c.schedule.id===selectedSchedule);
 const scopedSchedules=scope&&!selectedTime?[scope]:schedules;
 const slots=scopedSchedules.flatMap(calendar=>{
  const day=calendar.days.find(day=>day.date===selected);
  if(!day)return [];
  const operating=operatingSlots(day);
  return [...operating,...day.slots.filter(slot=>slot.booked>0&&!operating.includes(slot))]
   .map(slot=>({...slot,onlineOpen:operating.includes(slot),schedule:calendar.schedule.id,inventory:calendar.schedule.product_id,offers:calendar.offers,title:calendar.offers.map(offer=>offer.title).join(' / ')}));
 }).sort((a,b)=>a.time.localeCompare(b.time)||a.schedule.localeCompare(b.schedule));
 const next=selected>=today?slots.find(slot=>selected>today||slot.time.slice(0,5)>=localTime):undefined;
 const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3,5));
 const sellable=(slot:typeof slots[number])=>{
  const beforeCutoff=selected>today||(selected===today&&minutes(slot.time)-minutes(localTime)>15);
  return slot.onlineOpen&&beforeCutoff?slot.remaining:0;
 };
 const canRead=hasPermission(role,'bookings.read'),canCreate=hasPermission(role,'bookings.create');
 const detail=(slot:typeof slots[number])=>`${scheduleUrl}?view=agenda&date=${selected}&schedule=${slot.schedule}&time=${encodeURIComponent(slot.time)}`;
 const agendaUrl=`${scheduleUrl}?date=${selected}`;
 const chosen=selectedTime?slots.find(slot=>slot.time===selectedTime&&slot.schedule===selectedSchedule):undefined;
 if(selectedTime)return <section className={styles.agenda} data-tours-workspace data-passenger-list>
  <Link className={styles.back} prefetch={false} href={agendaUrl}><span aria-hidden="true">←</span> Schedule</Link>
  <h1>Passenger list</h1>
  {chosen?<><header className={styles.detailHeader}><strong>{chosen.time.slice(0,5)}</strong><div><h2>{chosen.title}</h2><p>{dateLabel} · {meeting??'Meeting point unavailable'}</p></div></header>
   <div className={styles.summary}><strong>Seat summary</strong><span>{chosen.booked} of {chosen.capacity} seats booked</span><span>{sellable(chosen)} seats available</span></div>
   <div className={styles.actions}>{canCreate&&!walkIn&&<Link prefetch={false} data-primary href={detail(chosen)+'&walkIn=1'}><span aria-hidden="true">+</span>Add walk-in</Link>}
   <details className={styles.manage}><summary>Manage</summary>
    <Link prefetch={false} href={`${scheduleUrl}?view=calendar&date=${selected}&schedule=${chosen.schedule}#departure-${chosen.time.slice(0,5)}`}>Manage departure sales</Link>
    <Link prefetch={false} href={`${scheduleUrl}?view=calendar&date=${selected}&schedule=${chosen.schedule}`}>Manage date</Link>
   </details></div>
   {canRead&&(chosen.id||walkIn)&&passengerList
    ?passengerList({
     date:selected,departure:chosen.id??undefined,
     product:chosen.offers.length===1?chosen.offers[0].id:undefined,
     create:walkIn?'1':undefined,returnTo:detail(chosen),time:chosen.time,inventory:chosen.inventory,
     alternatives:slots.flatMap(slot=>slot.id&&sellable(slot)>0?[slot.id]:[]),
    })
    :canRead&&<p>No passenger bookings for this departure.</p>}
  </>:<p role="status">This departure is unavailable. Return to Schedule to choose another departure.</p>}
 </section>;
 return <section className={styles.agenda} data-tours-workspace data-admin-context={view==='today'?'today':'availability'}>
  <header><h1>{heading}</h1><p>{dateLabel}</p></header>
  {view==='agenda'&&<Form action={scheduleUrl} prefetch={false} className={styles.filters}>
   <label>Date<input type="date" name="date" defaultValue={selected} required/></label>
   <label>Product scope<select name="schedule" defaultValue={scope?.schedule.id??''}><option value="">All active tours</option>{schedules.map(c=><option key={c.schedule.id} value={c.schedule.id}>{c.offers.map(offer=>offer.title).join(' / ')}</option>)}</select></label>
   <button type="submit">Show departures</button><Link prefetch={false} href={`${scheduleUrl}?view=calendar&date=${selected}${scope?'&schedule='+scope.schedule.id:''}`}>Month planning</Link>
  </Form>}
  {next&&<article className={styles.next}>
   <span className={styles.badge}>Next departure</span>
   <div className={styles.departureInfo}><div className={styles.detailHeader}><strong>{next.time.slice(0,5)}</strong><div><h2>{next.title}</h2><p><AdminIcon name="map-pin" size={16}/>{meeting??'Meeting point unavailable'}</p></div></div>
   <ul><li>{next.booked} of {next.capacity} seats booked</li><li>{sellable(next)} seats available</li>{next.held>0&&<li>{next.held} {next.held===1?'seat':'seats'} temporarily held</li>}{next.id&&checkInProgress?.(next.id)}</ul></div>
   <div className={styles.actions}><Link prefetch={false} href={detail(next)}><AdminIcon name="users" size={18}/>{canRead?'Passenger list':'Departure details'}</Link>{canCreate&&<Link prefetch={false} data-primary href={detail(next)+'&walkIn=1'}><span aria-hidden="true">+</span>Add walk-in</Link>}</div>
  </article>}
  {!slots.length?<p className={styles.summary}>No service for this date and product scope.</p>:!next&&<p className={styles.summary}>No upcoming departures for this date.</p>}
  <ul className={styles.rows}>{slots.filter(slot=>slot!==next).map(slot=><li key={slot.schedule+slot.time}><Link prefetch={false} href={detail(slot)}><time>{slot.time.slice(0,5)}</time><strong>{slot.title}</strong><span>{sellable(slot)} seats available</span><AdminIcon name="arrow-right" size={16}/></Link></li>)}</ul>
  {view==='agenda'&&hasPermission(role,'tracking.manage')&&<Link prefetch={false} href={root+'/live-map'}>Live service</Link>}
  {liveIssue}
  {view==='today'&&<Link prefetch={false} href={agendaUrl}>Open Schedule</Link>}
 </section>;
}
