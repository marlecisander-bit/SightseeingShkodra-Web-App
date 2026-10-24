import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {withOperatorService} from '@/modules/identity/operator-service';
import {dashboardDate,dashboardRowLimit,summarizeBookings,unavailableBookings,type DailyBookings} from './daily-bookings';

/** Internal trusted read, not an endpoint. Authorization must precede calling this adapter. */
export async function readDailyBookings(client:Pick<SupabaseClient,'from'>,operatorId:string,now:Date):Promise<DailyBookings>{
 let timeZone='Europe/Tirane';
 try {
  const operator=await client.from('operators').select('timezone').eq('id',operatorId).abortSignal(AbortSignal.timeout(5000)).single();
  if(operator.error||typeof operator.data?.timezone!=='string')return unavailableBookings(now);
  // Intl validation rejects invalid configuration; never silently aggregate using another date.
  dashboardDate(now,operator.data.timezone);timeZone=operator.data.timezone;
  const result=await client.from('booking_items').select(
   'id,operator_id,status,quantity,occupied_seats,total_price,departure:departures!inner(operator_id,service_date),order:orders!inner(operator_id,status,currency,booking:bookings!inner(operator_id,status))',
   {count:'exact'})
   .eq('operator_id',operatorId).eq('status','confirmed')
   .eq('departure.operator_id',operatorId).eq('departure.service_date',dashboardDate(now,timeZone))
   .eq('order.operator_id',operatorId).eq('order.status','confirmed')
   .eq('order.booking.operator_id',operatorId).eq('order.booking.status','confirmed')
   .order('id').limit(dashboardRowLimit+1).abortSignal(AbortSignal.timeout(5000));
  if(result.error)return unavailableBookings(now,timeZone);
  return summarizeBookings(operatorId,now,timeZone,result.data,result.count);
 }catch{return unavailableBookings(now,timeZone);}
}
export async function getDailyBookings(operatorId:string,now=new Date()):Promise<DailyBookings>{
 // Keep authorization outside the recoverable data-error boundary. No cross-request cache.
 return withOperatorService(operatorId,'bookings.read',(client,context)=>readDailyBookings(client,context.operatorId,now));
}
