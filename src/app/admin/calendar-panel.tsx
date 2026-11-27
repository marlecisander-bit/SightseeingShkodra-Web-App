import {Suspense} from 'react';
import {readPublicMap} from '@/modules/tracking/public-map-server';
import {staleAfterMs} from '@/modules/tracking/positions';
import {withinTrackingHours} from '@/modules/tracking/service-hours';
import {AdminIcon} from './admin-icon';
import agendaStyles from './departure-agenda.module.css';
import {meetingPoint} from '@/modules/booking/meeting-point';
import {BookingsPanel} from './bookings-panel';
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
async function LiveServiceIssue({operatorId}:{operatorId:string}){
 if(process.env.PUBLIC_OPERATOR_ID!==operatorId)return null;
 const data=await readPublicMap(undefined,true);
 const now=new Date();
 if(withinTrackingHours(data?.serviceHours??null,now)!==true)return null;
 const position=data?.snapshot.positions[0];
 const age=position?now.getTime()-Date.parse(position.updatedAt):NaN;
 if(Number.isFinite(age)&&age>=-30_000&&age<=staleAfterMs)return null;
 return <div className={agendaStyles.issue}><AdminIcon name="info" size={18}/><strong>{position?'GPS update delayed':'GPS location unavailable'}</strong><Link prefetch={false} href={`/admin/${operatorId}/live-map`}>Live tracking and operational stops</Link></div>;
}

async function CheckInProgress({operatorId,departure}:{operatorId:string;departure:string}){
 const progress=await withOperatorService(operatorId,'bookings.read',async client=>{
  const items=await client.from('booking_items').select('order_id',{count:'exact'}).eq('operator_id',operatorId).eq('departure_id',departure).eq('status','confirmed');
  if(items.error||items.count!==items.data.length)throw Error('Attendance unavailable');
  const orders=[...new Set(items.data.map(item=>item.order_id))];
  if(!orders.length)return {total:0,checked:0};
  const parties=await client.from('bookings').select('checked_in_at',{count:'exact'}).eq('operator_id',operatorId).in('order_id',orders).eq('status','confirmed');
  if(parties.error||parties.count!==parties.data.length)throw Error('Attendance unavailable');
  return {total:parties.data.length,checked:parties.data.filter(party=>party.checked_in_at).length};
 }).catch(()=>null);
 return progress?<li>{progress.checked} of {progress.total} {progress.total===1?'party':'parties'} checked in</li>:null;
}

export async function CalendarPanel({operatorId,date,result,fromBookings,view:requestedView,history,schedule:requestedSchedule,product:requestedProduct,time,walkIn}:{product?:string;operatorId:string;date?:string;result?:string;fromBookings?:string;view?:string;history?:string;schedule?:string;time?:string;walkIn?:string}) {
 const context=await requirePermission(operatorId,'departures.manage'),view=toursView(requestedView??(fromBookings==='1'||result||history==='1'?'calendar':undefined));
 if(view==='prices'||view==='tickets')redirect(`/admin/${operatorId}/products`);
 if(requestedView==='route'||requestedView==='live'){
  if(hasPermission(context.role,'tracking.manage'))redirect(`/admin/${operatorId}/live-map`);
  if(requestedView==='route'&&hasPermission(context.role,'content.manage'))redirect(`/admin/${operatorId}/route-stops`);
  redirect('/route');
 }
 const data=await withOperatorService(operatorId,'departures.manage',async(client,ctx)=>{try{
  const [s,p,v,o,m]=await Promise.all([client.from('service_schedules').select('*',{count:'exact'}).eq('operator_id',operatorId).order('start_date').limit(101),client.from('products').select('id,title,status,active,availability_presentation,updated_at,inventory_product_id,seat_reservation_mode,reservation_minutes',{count:'exact'}).eq('operator_id',operatorId).eq('type','van_tour').limit(101),client.from('vehicles').select('id,name',{count:'exact'}).eq('operator_id',operatorId).limit(101),client.from('operators').select('timezone').eq('id',operatorId).single(),client.from('meeting_point_versions').select('details').eq('operator_id',operatorId).lte('effective_at',new Date().toISOString()).order('effective_at',{ascending:false}).limit(1).maybeSingle()]);
  if(s.error||p.error||v.error||o.error||[s,p,v].some(r=>r.count!==r.data?.length||(r.data?.length??0)>100))throw Error('Calendar unavailable');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:o.data.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const selected=validBookingDay(date)??today;const month=selected.slice(0,7)+'-01';
  const calendars=await Promise.all(s.data.map(async(schedule)=>{const response=await client.rpc('read_operations_calendar_v1',{p_operator:operatorId,p_actor:ctx.staffProfileId,p_schedule:schedule.id,p_month:month});const {error}=response;const data=response.data;if(error)throw Error('Calendar data unavailable');const product=p.data.find(item=>item.id===schedule.product_id);if(!product)throw Error('Product unavailable');return {schedule:schedule as ServiceSchedule,title:product.title,days:data.days as CalendarDay[],categories:data.categories as PassengerCategories};}));
  return {role:ctx.role,calendars,products:p.data,vehicles:v.data.map(v=>({id:v.id,label:v.name})),today,month,selected,timeZone:o.data.timezone,meeting:m.error?undefined:m.data?.details?.name??meetingPoint.name};
 }catch{return null;}
 });
 if(!data)return <ToursWorkspace operatorId={operatorId} role={context.role} view={view} error="Tour data is temporarily unavailable. Refresh before making changes."/>;
 if(view==='today'||view==='agenda')return <ToursWorkspace operatorId={operatorId} role={data.role} view={view} projection={data} selectedSchedule={requestedSchedule} selectedTime={time} walkIn={walkIn==='1'} passengerList={input=><BookingsPanel operatorId={operatorId} {...input} manifest/>} checkInProgress={hasPermission(data.role,'bookings.read')?id=><Suspense fallback={null}><CheckInProgress operatorId={operatorId} departure={id}/></Suspense>:undefined} liveIssue={view==='today'&&hasPermission(data.role,'tracking.manage')?<Suspense fallback={null}><LiveServiceIssue operatorId={operatorId}/></Suspense>:undefined}/>;
 return <ToursWorkspace operatorId={operatorId} role={data.role} view="calendar" projection={data}><div data-admin-context="availability">{data.role==="owner" && <MeetingPointPanel operatorId={operatorId}/ >}{result&&<p role="status">{result==='prepared'?'Existing schedule loaded for the selected date.':'Schedule updated.'}</p>}<OperatingCalendarWorkspace operatorId={operatorId} calendars={data.calendars} products={data.products} selectedSchedule={requestedSchedule??data.calendars.find(c=>c.schedule.product_id===(data.products.find(p=>p.id===requestedProduct)?.inventory_product_id??requestedProduct))?.schedule.id} selectedDate={data.selected} month={data.month} today={data.today} timeZone={data.timeZone} canPrice={hasPermission(data.role,"pricing.manage")} fromBookings={fromBookings==='1'}/>{history==='1'?<details open><summary>Departure history & legacy tools</summary><InventoryHistoryPanel operatorId={operatorId} date={date}/></details>:<p><Link prefetch={false} href={`/admin/${operatorId}/departures?view=calendar&history=1&date=${data.selected}`}>Departure history & legacy tools</Link></p>}</div></ToursWorkspace>;
}
