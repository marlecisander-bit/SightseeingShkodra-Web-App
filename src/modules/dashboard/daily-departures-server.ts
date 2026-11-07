import 'server-only';
import {withOperatorService} from '@/modules/identity/operator-service';
import {dashboardDate} from './daily-bookings';
import {summarizeDepartures,unavailableDepartures} from './daily-departures';
import type {CalendarDay} from '@/app/admin/operations-calendar';
export function getDailyDepartures(operatorId:string,now:Date){
 return withOperatorService(operatorId,'departures.manage',async(client,context)=>{
  try{
   const operator=await client.from('operators').select('timezone').eq('id',context.operatorId).abortSignal(AbortSignal.timeout(5000)).single();
   if(operator.error||!operator.data?.timezone)return unavailableDepartures();
   const date=dashboardDate(now,operator.data.timezone);
   const schedules=await client.from('service_schedules').select('id,product:products!inner(title)',{count:'exact'}).eq('operator_id',context.operatorId).eq('status','active').lte('start_date',date).gte('end_date',date).limit(101).abortSignal(AbortSignal.timeout(5000));
   if(schedules.error||schedules.count!==schedules.data?.length||schedules.data.length>100)return unavailableDepartures();
   const calendars=await Promise.all(schedules.data.map(async schedule=>{
    const response=await client.rpc('read_operations_calendar_v1',{p_operator:context.operatorId,p_actor:context.staffProfileId,p_schedule:schedule.id,p_month:date.slice(0,7)+'-01'}).abortSignal(AbortSignal.timeout(5000));
    if(response.error||!Array.isArray(response.data?.days))throw Error('Schedule unavailable');
    const product=Array.isArray(schedule.product)?schedule.product[0]:schedule.product;
    if(!product?.title)throw Error('Product unavailable');
    return {id:schedule.id,title:product.title,days:response.data.days as CalendarDay[]};
   }));
   const localTime=new Intl.DateTimeFormat('en-GB',{timeZone:operator.data.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
   return summarizeDepartures(calendars,date,localTime);
  }catch{return unavailableDepartures();}
 });
}
