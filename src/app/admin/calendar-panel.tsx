import {MeetingPointPanel} from "./meeting-point-panel";
import {hasPermission} from "@/modules/identity/roles";
import styles from "./calendar.module.css";
import {withOperatorService} from '@/modules/identity/operator-service';
import {OperationsCalendar,StandardPricing,type CalendarDay} from './operations-calendar';
import {ScheduleEditor,type ServiceSchedule} from './schedule-editor';
import {InventoryHistoryPanel} from './departures-panel';
import type {PassengerCategories} from '@/modules/booking/passengers';
export async function CalendarPanel({operatorId,date,result}:{operatorId:string;date?:string;result?:string}) {
 const data=await withOperatorService(operatorId,'departures.manage',async(client,ctx)=>{
  const [s,p,v,o]=await Promise.all([client.from('service_schedules').select('*').eq('operator_id',operatorId).order('start_date'),client.from('products').select('id,title,updated_at').eq('operator_id',operatorId).eq('type','van_tour'),client.from('vehicles').select('id,name').eq('operator_id',operatorId),client.from('operators').select('timezone').eq('id',operatorId).single()]);
  if(s.error||p.error||v.error||o.error)throw Error('Calendar unavailable');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:o.data.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const selected=date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))?date:today;const month=selected.slice(0,7)+'-01';
  const calendars=await Promise.all(s.data.map(async(schedule)=>{const {data,error}=await client.rpc('read_operations_calendar_v1',{p_operator:operatorId,p_actor:ctx.staffProfileId,p_schedule:schedule.id,p_month:month});if(error)throw Error('Calendar data unavailable');return {schedule:schedule as ServiceSchedule,days:data.days as CalendarDay[],categories:data.categories as PassengerCategories};}));
  return {role:ctx.role,calendars,products:p.data,vehicles:v.data.map(v=>({id:v.id,label:v.name})),today,month};
 });
 return <div>{data.role==="owner" && <MeetingPointPanel operatorId={operatorId}/ >}{result&&<p role="status">Schedule updated.</p>}<p>Select a date or range to manage sales, departures, seats and ticket prices. Existing reservations retain their confirmed prices.</p>{data.calendars.map(({schedule,days,categories})=>{const product=data.products.find(p=>p.id===schedule.product_id)!;return <section className={styles.service} key={schedule.id}><h2>{product.title}</h2><p className={styles.servicePeriod}>Service period: {schedule.start_date} – {schedule.end_date}</p><OperationsCalendar canPrice={hasPermission(data.role,"pricing.manage")} key={schedule.id+data.month} operatorId={operatorId} schedule={schedule} days={days} month={data.month} today={data.today}/><div className={styles.standardSettings}><details><summary>Standard Schedule</summary><ScheduleEditor operatorId={operatorId} schedule={schedule} products={data.products.map(p=>({id:p.id,label:p.title}))} vehicles={data.vehicles}/></details>{hasPermission(data.role,"pricing.manage") && <details><summary>Standard Pricing</summary><StandardPricing key={product.updated_at} operatorId={operatorId} productId={product.id} stamp={product.updated_at} categories={categories}/></details>}</div></section>;})}<details><summary>Add Standard Schedule</summary><ScheduleEditor operatorId={operatorId} products={data.products.filter(p=>!data.calendars.some(c=>c.schedule.product_id===p.id)).map(p=>({id:p.id,label:p.title}))} vehicles={data.vehicles}/></details><details><summary>Advanced: departure history</summary><InventoryHistoryPanel operatorId={operatorId} date={date}/></details></div>;
}
