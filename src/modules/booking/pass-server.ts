import 'server-only';
import { withOperatorService } from '../identity/operator-service';
/** Future scanner port: authenticated tenant scope; never a public token lookup. */
export async function resolveBookingPass(operatorId:string, token:string, checkIn=false) {
  return withOperatorService(operatorId, checkIn ? 'bookings.create' : 'bookings.read', async (client,context)=>{
    if(!/^[0-9a-f]{64}$/.test(token)) return {status:'INVALID'};
    const {data,error}=await client.rpc('resolve_booking_pass_v1',{p_operator_id:context.operatorId,p_actor_id:context.staffProfileId,p_token:token,p_check_in:checkIn});
    if(error) throw new Error('Booking pass unavailable');
    return data;
  });
}
