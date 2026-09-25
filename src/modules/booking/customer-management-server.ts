import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { quoteAvailability, type AvailabilitySnapshot } from './availability';
import { passengerCount, type PassengerCounts } from './passengers';
export async function manageBooking(body: Record<string,unknown>) {
 const token=body.token;
 if(typeof token!=='string'|| !/^[a-f0-9]{64}$/.test(token)) throw Error('NOT_FOUND');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw Error('UNAVAILABLE');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(15000)})}});
 const args:Record<string,unknown>={p_token:token};let rpc='customer_booking_v1';
 if(body.action==='availability'||body.action==='modify'){
  const counts=body.counts as PassengerCounts;try{passengerCount(counts);}catch{throw Error('INVALID_REQUEST');}
  args.p_counts=counts;
  if(body.action==='availability') {if(typeof body.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.date))throw Error('INVALID_REQUEST');rpc='customer_booking_availability_v1';args.p_date=body.date;}
  else {if(!Number.isSafeInteger(body.version)||!Number.isSafeInteger(body.total)||typeof body.departureId!=='string'||typeof body.requestId!=='string'||![body.departureId,body.requestId].every(v=>/^[0-9a-f-]{36}$/.test(v)))throw Error('INVALID_REQUEST');rpc='modify_customer_booking_v1';Object.assign(args,{p_version:body.version,p_departure:body.departureId,p_expected_total:body.total,p_request:body.requestId});}
 } else if(body.action==='cancel')rpc='cancel_customer_booking_v1';else if(body.action!=='read')throw Error('INVALID_REQUEST');
 const {data,error}=await client.rpc(rpc,args);
 if(error)throw Error(({P0002:'NOT_FOUND',PT410:'CLOSED',PT403:'CONTACT_OPERATOR',PT409:'CHANGED',P0001:'SOLD_OUT','22023':'INVALID_REQUEST',PT422:'ADULT_REQUIRED'} as Record<string,string>)[error.code]??'UNAVAILABLE');
 if(body.action==='availability'){
  if(!data)throw Error('UNAVAILABLE');
  return quoteAvailability({version:1,operatorId:data.operator_id,productId:data.product_id,date:body.date as string,guests:passengerCount(body.counts as PassengerCounts),passengers:body.counts as PassengerCounts},data as AvailabilitySnapshot);
 }
 return data;
}
