"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {OperationsCalendar,type CalendarDay} from './operations-calendar';
import type {ServiceSchedule} from './schedule-editor';
import {availabilityPresentation,type AvailabilityPresentation} from '@/modules/booking/product-availability';
import styles from './calendar.module.css';
type Product={id:string;title:string;active?:boolean;availability_presentation?:AvailabilityPresentation|null;inventory_product_id:string|null};
export function OperatingCalendarWorkspace({operatorId,calendars,products,selectedSchedule,selectedDate,month,today,timeZone,canPrice,fromBookings=false}:{operatorId:string;calendars:{schedule:ServiceSchedule;title:string;days:CalendarDay[]}[];products:Product[];selectedSchedule?:string;selectedDate:string;month:string;today:string;timeZone:string;canPrice:boolean;fromBookings?:boolean}){
 const router=useRouter();
 const current=calendars.find(c=>c.schedule.id===selectedSchedule)??calendars[0];
 if(!current)return <p>No operating schedule yet. <Link href={`/admin/${operatorId}/products`}>Set up a product schedule</Link></p>;
 const product=products.find(p=>p.id===current.schedule.product_id);
 const offers=products.filter(p=>p.id===current.schedule.product_id||p.inventory_product_id===current.schedule.product_id);
 const availability=product?availabilityPresentation({active:product.active,availability:product.availability_presentation??undefined}):null;
 return <section className={styles.operatingWorkspace} aria-label="Operating calendar">
  <div className={styles.serviceToolbar}><label>Service schedule<select value={current.schedule.id} onChange={event=>{if(!window.dispatchEvent(new Event('admin:before-navigation',{cancelable:true})))return;const query=new URLSearchParams(window.location.search);query.set('view','calendar');query.set('schedule',event.target.value);if(!query.has('date'))query.set('date',selectedDate);router.push('?'+query.toString(),{scroll:false});}}>{calendars.map(c=><option key={c.schedule.id} value={c.schedule.id}>{c.title}</option>)}</select></label><Link prefetch={false} href={`/admin/${operatorId}/products?product=${current.schedule.product_id}&tab=schedule#usual-schedule`}>Edit usual schedule</Link></div>
  <p className={styles.servicePeriod}>Operating period: {current.schedule.start_date} – {current.schedule.end_date} · {timeZone}</p>
  <div className={styles.salesNotice} data-paused={product?.active===false||current.schedule.status!=='active'}>
   <strong>{product?.active===false?`Product sales paused — ${availability?.label}`:current.schedule.status!=='active'?'Usual schedule paused':'Product sales enabled'}</strong>
   <p>{product?.active===false?'Opening a date does not lift this product pause. Change availability in Products when you are ready to accept bookings.':current.schedule.status!=='active'?'Activate the usual schedule in Products before accepting bookings.':'Date closures, prices, remaining seats and booking cutoff still apply.'}</p>
   {product?.active===false&&<Link prefetch={false} href={`/admin/${operatorId}/products?product=${product.id}&tab=schedule`}>Review product availability</Link>}
  </div>
  {offers.length>1&&<p className={styles.calendarNote}>Shared schedule and van seats: {offers.map(p=>p.title).join(', ')}. Schedule changes affect these offers; their product sales switches remain separate.</p>}
  <OperationsCalendar key={current.schedule.id+month+selectedDate} operatorId={operatorId} schedule={current.schedule} days={current.days} initialDate={selectedDate} month={month} today={today} timeZone={timeZone} canPrice={canPrice} fromBookings={fromBookings}/>
 </section>;
}
