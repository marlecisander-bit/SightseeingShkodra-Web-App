"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {OperationsCalendar,type CalendarDay} from './operations-calendar';
import type {ServiceSchedule} from './schedule-editor';
import {availabilityPresentation,type AvailabilityPresentation} from '@/modules/booking/product-availability';
import styles from './calendar.module.css';
type Product={id:string;title:string;active?:boolean;availability_presentation?:AvailabilityPresentation|null;status?:string;inventory_product_id:string|null};
export function OperatingCalendarWorkspace({operatorId,calendars,products,selectedSchedule,selectedDate,month,today,timeZone,canPrice,fromBookings=false}:{operatorId:string;calendars:{schedule:ServiceSchedule;title:string;days:CalendarDay[]}[];products:Product[];selectedSchedule?:string;selectedDate:string;month:string;today:string;timeZone:string;canPrice:boolean;fromBookings?:boolean}){
 const router=useRouter();
 const current=calendars.find(c=>c.schedule.id===selectedSchedule)??calendars[0];
 if(!current)return <p>No operating schedule yet. <Link href={`/admin/${operatorId}/products`}>Set up a product schedule</Link></p>;
 const product=products.find(p=>p.id===current.schedule.product_id);
 const offers=products.filter(p=>p.id===current.schedule.product_id||p.inventory_product_id===current.schedule.product_id);
 const salesPaused=!offers.some(p=>p.active!==false&&(p.status===undefined||p.status==='published'))||current.schedule.status!=='active';
 const availability=product?availabilityPresentation({active:product.active,availability:product.availability_presentation??undefined}):null;
 return <section className={styles.operatingWorkspace} aria-label="Operating calendar">
  <div className={styles.serviceToolbar}><label>Service schedule<select value={current.schedule.id} onChange={event=>{if(!window.dispatchEvent(new Event('admin:before-navigation',{cancelable:true})))return;const query=new URLSearchParams(window.location.search);query.set('view','calendar');query.set('schedule',event.target.value);if(!query.has('date'))query.set('date',selectedDate);router.push('?'+query.toString(),{scroll:false});}}>{calendars.map(c=><option key={c.schedule.id} value={c.schedule.id}>{c.title}</option>)}</select></label><Link prefetch={false} href={`/admin/${operatorId}/products?product=${current.schedule.product_id}&tab=schedule#usual-schedule`}>Edit usual schedule</Link></div>
  <p className={styles.servicePeriod}>Operating period: {current.schedule.start_date} – {current.schedule.end_date} · {timeZone}</p>
  <div className={styles.salesNotice} data-paused={salesPaused}>
   <strong>{salesPaused?(current.schedule.status!=='active'?'Usual schedule paused':product?.active===false?`Product sales paused — ${availability?.label}`:'No active published products'):'Product sales enabled'}</strong>
   <p>{salesPaused&&product?.active===false?'No times are offered while this service has no active products. Existing reservations remain in Bookings.':current.schedule.status!=='active'?'Activate the usual schedule in Products before accepting bookings.':'Product times and prices apply automatically. Calendar manages date closures and seat limits.'}</p>
   {product?.active===false&&<Link prefetch={false} href={`/admin/${operatorId}/products?product=${product.id}&tab=schedule`}>Review product availability</Link>}
  </div>
  {offers.length>1&&<details className={styles.calendarNote}><summary>Offers sharing this schedule</summary><p>Shared schedule and van seats: {offers.map(p=>p.title).join(', ')}. Schedule changes affect these offers; their product sales switches remain separate.</p></details>}
  <OperationsCalendar key={current.schedule.id+month+selectedDate} operatorId={operatorId} schedule={current.schedule} days={current.days} initialDate={selectedDate} month={month} today={today} timeZone={timeZone} salesPaused={salesPaused} canPrice={canPrice} fromBookings={fromBookings}/>
 </section>;
}
