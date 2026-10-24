'use client';
import {useSearchParams} from 'next/navigation';
import {ToursWorkspace,toursView} from '@/app/admin/tours-workspace';
import {OperationsCalendar,StandardPricing,type CalendarDay} from '@/app/admin/operations-calendar';
import {ScheduleEditor,type ServiceSchedule} from '@/app/admin/schedule-editor';
import {validBookingDay} from '@/app/admin/bookings-presentation';
import {hasPermission,type StaffRole} from '@/modules/identity/roles';
import type {PassengerCategories,PassengerSnapshot} from '@/modules/booking/passengers';
import styles from '@/app/admin/calendar.module.css';
const op='10000000-0000-4000-8000-000000000001';
const categories:PassengerCategories={adult:{min:13,max:null,price:6000},child:{min:3,max:12,price:3000},infant:{min:0,max:2,price:0}};
const quote:PassengerSnapshot={version:1,counts:{adult:1,child:0,infant:0},categories,currency:'EUR',subtotal:6000,total:6000,lines:[{category:'adult',quantity:1,unitPrice:6000,basePrice:6000,total:6000,minAge:13,maxAge:null,offer:null}]};
const schedule:ServiceSchedule={id:'10000000-0000-4000-8000-000000000060',product_id:'10000000-0000-4000-8000-000000000061',start_date:'2026-10-01',end_date:'2027-12-31',weekdays:[1,2,3,4,5,6,7],departure_times:[{time:'11:00'},{time:'15:00'}],default_capacity:8,vehicle_id:null,status:'active',updated_at:'2026-10-24T07:00:00Z',calendar_ranges:[]};
export function ToursFixture({role,state}:{role:StaffRole;state:string}){
 const search=useSearchParams(),view=toursView(search.get('view')??undefined),selected=validBookingDay(search.get('date')??undefined)??'2026-10-24',month=selected.slice(0,7)+'-01';
 const count=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();
 const days:CalendarDay[]=Array.from({length:count},(_,i)=>{const date=month.slice(0,8)+String(i+1).padStart(2,'0');return {date,range:null,exception:date.endsWith('26')?{closed:true,calendar_settings:{closed:true},departure_times:[]}:null,slots:state==='empty'?[]:['11:00','15:00'].map((time,n)=>({id:null,time,capacity:8,open:!date.endsWith('26'),booked:date.endsWith('25')?8:n?0:2,held:date.endsWith('25')?0:n?0:1,remaining:date.endsWith('25')||date.endsWith('26')?0:n?8:5,quote}))};});
 if(!hasPermission(role,'departures.manage'))return <><h1>Tours</h1><p>Operational access unavailable.</p></>;
 if(state==='loading')return <div aria-busy="true"><h1>Tours</h1><p role="status">Loading tour operations…</p></div>;
 const data={today:'2026-10-24',selected,timeZone:'Europe/Tirane',calendars:[{schedule,title:'Shkodra sightseeing tour',days}]};
 return <ToursWorkspace operatorId={op} role={role} view={view} projection={['today','calendar','prices'].includes(view)&&state!=='error'?data:undefined} error={state==='error'?'Synthetic unavailable state.':undefined}>
  {state!=='error'&&view==='calendar'&&<section className={styles.service}><h2>Shkodra sightseeing tour</h2><p className={styles.servicePeriod}>Illustrative existing schedule · all form submissions are blocked</p><OperationsCalendar key={month+selected} initialDate={selected} fromBookings={search.get('fromBookings')==='1'} operatorId={op} schedule={schedule} days={days} month={month} today="2026-10-24" canPrice={hasPermission(role,'pricing.manage')}/><details data-admin-context="schedule"><summary>Standard Schedule</summary><ScheduleEditor operatorId={op} schedule={schedule} products={[{id:schedule.product_id,label:'Shkodra sightseeing tour'}]} vehicles={[]}/></details>{hasPermission(role,'pricing.manage')&&<details data-admin-context="prices"><summary>Standard Pricing</summary><StandardPricing operatorId={op} productId={schedule.product_id} stamp={schedule.updated_at} categories={categories}/></details>}</section>}
  {state!=='error'&&view==='prices'&&hasPermission(role,'pricing.manage')&&<section className={styles.service}><h2>Shkodra sightseeing tour</h2><StandardPricing operatorId={op} productId={schedule.product_id} stamp={schedule.updated_at} categories={categories}/></section>}
 </ToursWorkspace>;
}
