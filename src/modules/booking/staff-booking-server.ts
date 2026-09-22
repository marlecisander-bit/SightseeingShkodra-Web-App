import 'server-only';
import { withOperatorService } from '../identity/operator-service';
export async function createStaffBooking(input:{operatorId:string;departureId:string;requestId:string;quantity:number;name:string;email:string;phone?:string}) {
  if(!Number.isSafeInteger(input.quantity)||input.quantity<1)throw Error('Invalid quantity');
  return withOperatorService(input.operatorId,'bookings.create',async(client,context)=>{
    const {data,error}=await client.rpc('create_staff_booking_v1',{p_operator_id:context.operatorId,p_actor_id:context.staffProfileId,
      p_departure_id:input.departureId,p_request_id:input.requestId,p_quantity:input.quantity,p_name:input.name,p_email:input.email,p_phone:input.phone??null});
    if(error||!data?.orderId)throw Error('Unable to create booking');
    return data as {version:1;bookingId:string;orderId:string;reference:string;status:string;total:number;currency:string;expiresAt:string};
  });
}
