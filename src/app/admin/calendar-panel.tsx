import {MeetingPointPanel} from "./meeting-point-panel";
import {redirect} from 'next/navigation';
import {hasPermission} from "@/modules/identity/roles";
import {OperatingCalendarWorkspace} from "./operating-calendar-workspace";
import {withOperatorService} from '@/modules/identity/operator-service';
import {type CalendarDay} from './operations-calendar';
import {type ServiceSchedule} from './schedule-editor';
import {InventoryHistoryPanel} from './departures-panel';
import {requirePermission} from '@/modules/identity/require-permission';
import {validBookingDay} from './bookings-presentation';
import {ToursWorkspace,toursView} from './tours-workspace';
import Link from 'next/link';
import type {PassengerCategories} from '@/modules/booking/passengers';
export async function CalendarPanel({operatorId,date,result,fromBookings,view:requestedView,history,schedule:requestedSchedule}:{operatorId:string;date?:string;result?:string;fromBookings?:string;view?:string;history?:string;schedule?:string}) {
 const context=await requirePermission(operatorId,'departures.manage'),view=toursView(requestedView);
 if(view==='prices'||view==='tickets')redirect(`/admin/${operatorId}/products`);
 if(['route','live'].includes(view))return <ToursWorkspace operatorId={operatorId} role={context.role} view={view}/>;
 const data=await withOperatorService(operatorId,'departures.manage',async(client,ctx)=>{try{
  const [s,p,v,o]=await Promise.all([client.from('service_schedules').select('*',{count:'exact'}).eq('operator_id',operatorId).order('start_date').limit(101),client.from('products').select('id,title,active,availability_presentation,updated_at,inventory_product_id,seat_reservation_mode,reservation_minutes',{count:'exact'}).eq('operator_id',operatorId).eq('type','van_tour').limit(101),client.from('vehicles').select('id,name',{count:'exact'}).eq('operator_id',operatorId).limit(101),client.from('operators').select('timezone').eq('id',operatorId).single()]);
  if(s.error||p.error||v.error||o.error||[s,p,v].some(r=>r.count!==r.data?.length||(r.data?.length??0)>100))throw Error('Calendar unavailable');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:o.data.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const selected=validBookingDay(date)??today;const month=selected.slice(0,7)+'-01';
  const calendars=await Promise.all(s.data.map(async(schedule)=>{const response=await client.rpc('read_operations_calendar_v1',{p_operator:operatorId,p_actor:ctx.staffProfileId,p_schedule:schedule.id,p_month:month});const {error}=response;const data=response.data;if(error)throw Error('Calendar data unavailable');const product=p.data.find(item=>item.id===schedule.product_id);if(!product)throw Error('Product unavailable');return {schedule:schedule as ServiceSchedule,title:product.title,days:data.days as CalendarDay[],categories:data.categories as PassengerCategories};}));
  return {role:ctx.role,calendars,products:p.data,vehicles:v.data.map(v=>({id:v.id,label:v.name})),today,month,selected,timeZone:o.data.timezone};
 }catch{return null;}
 });
 if(!data)return <ToursWorkspace operatorId={operatorId} role={context.role} view={view} error="Tour data is temporarily unavailable. Refresh before making changes."/>;
 if(view==='today')return <ToursWorkspace operatorId={operatorId} role={data.role} view={view} projection={data}/>;
 return <ToursWorkspace operatorId={operatorId} role={data.role} view="calendar" projection={data}><div data-admin-context="availability">{data.role==="owner" && <MeetingPointPanel operatorId={operatorId}/ >}{result&&<p role="status">{result==='prepared'?'Existing schedule loaded for the selected date.':'Schedule updated.'}</p>}<OperatingCalendarWorkspace operatorId={operatorId} calendars={data.calendars} products={data.products} selectedSchedule={requestedSchedule} selectedDate={data.selected} month={data.month} today={data.today} timeZone={data.timeZone} canPrice={hasPermission(data.role,"pricing.manage")} fromBookings={fromBookings==='1'}/>{history==='1'?<details open><summary>Departure history & legacy tools</summary><InventoryHistoryPanel operatorId={operatorId} date={date}/></details>:<p><Link prefetch={false} href={`/admin/${operatorId}/departures?view=calendar&history=1&date=${data.selected}`}>Departure history & legacy tools</Link></p>}</div></ToursWorkspace>;
}
