import 'server-only';
import {withOperatorService} from '@/modules/identity/operator-service';
import {dashboardDate} from './daily-bookings';
import {summarizeDepartures,unavailableDepartures,activeScheduleOffers} from './daily-departures';
import type {CalendarDay} from '@/app/admin/operations-calendar';
export function getDailyDepartures(operatorId:string,now:Date){
 return withOperatorService(operatorId,'departures.manage',async(client,context)=>{
  try{
   const operator=await client.from('operators').select('timezone').eq('id',context.operatorId).abortSignal(AbortSignal.timeout(5000)).single();
   if(operator.error||!operator.data?.timezone)return unavailableDepartures();
   const date=dashboardDate(now,operator.data.timezone);
   const schedules=await client.from('service_schedules').select('id,product_id',{count:'exact'}).eq('operator_id',context.operatorId).eq('status','active').lte('start_date',date).gte('end_date',date).limit(101).abortSignal(AbortSignal.timeout(5000));
   if(schedules.error||schedules.count!==schedules.data?.length||schedules.data.length>100)return unavailableDepartures();
   const products=await client.from('products').select('id,title,active,status,inventory_product_id',{count:'exact'}).eq('operator_id',context.operatorId).eq('type','van_tour').limit(101).abortSignal(AbortSignal.timeout(5000));
   if(products.error||products.count!==products.data?.length||products.data.length>100)return unavailableDepartures();
   const enabled=schedules.data.map(schedule=>({schedule,offers:activeScheduleOffers(schedule.product_id,products.data)})).filter(item=>item.offers.length);
   const calendars=await Promise.all(enabled.map(async ({schedule,offers})=>{
    const response=await client.rpc('read_operations_calendar_v1',{p_operator:context.operatorId,p_actor:context.staffProfileId,p_schedule:schedule.id,p_month:date.slice(0,7)+'-01'}).abortSignal(AbortSignal.timeout(5000));
    if(response.error||!Array.isArray(response.data?.days))throw Error('Schedule unavailable');
    return {id:schedule.id,title:offers.map(p=>p.title).join(' / '),days:response.data.days as CalendarDay[]};
   }));
   const localTime=new Intl.DateTimeFormat('en-GB',{timeZone:operator.data.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
   return summarizeDepartures(calendars,date,localTime);
  }catch{return unavailableDepartures();}
 });
}
