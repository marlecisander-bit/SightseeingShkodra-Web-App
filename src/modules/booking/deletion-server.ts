import 'server-only';
import {withOperatorService} from '../identity/operator-service';
export class BookingDeletionError extends Error{
 constructor(public readonly code:'INVALID_REQUEST'|'NOT_FOUND'|'BUSY'|'UNAVAILABLE'){super(code);}
}
export async function deleteBookingRecord(operatorId:string,bookingId:string,reference:string,reason:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)||!reference.trim()||reference.length>200||!reason.trim()||reason.trim().length>500)throw new BookingDeletionError('INVALID_REQUEST');
 return withOperatorService(operatorId,'bookings.delete',async(client,context)=>{
  const {data,error}=await client.rpc('delete_admin_booking_v1',{p_operator:context.operatorId,p_actor:context.staffProfileId,p_booking:bookingId,p_reference:reference.trim(),p_reason:reason.trim()});
  if(error)throw new BookingDeletionError(error.code==='PT409'?'BUSY':error.code==='P0002'?'NOT_FOUND':'UNAVAILABLE');
  if(data?.version!==1||data.bookingId!==bookingId||data.deleted!==true)throw new BookingDeletionError('UNAVAILABLE');
  return data as {version:1;bookingId:string;deleted:true};
 });
}
