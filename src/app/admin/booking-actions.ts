'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createStaffBooking} from '../../modules/booking/staff-booking-server';
import {cancelOrder} from '../../modules/booking/cancellation-server';
export async function manualBooking(operatorId:string,form:FormData) {
  let result='created';
  const rawRequest=form.get('request_id');
  const retry=typeof rawRequest==='string'&&/^[0-9a-f-]{36}$/i.test(rawRequest)?rawRequest:'';
  try {
    const get=(key:string)=>{const v=form.get(key);return typeof v==='string'?v:'';};
    if(!/^\d+$/.test(get('quantity')))throw Error('Invalid quantity');
    await createStaffBooking({operatorId,departureId:get('departure_id'),requestId:get('request_id'),quantity:Number(get('quantity')),name:get('name'),email:get('email'),phone:get('phone')});
  }catch{result='error';}
  const path=`/admin/${encodeURIComponent(operatorId)}/bookings`;revalidatePath(path);redirect(`${path}?result=${result}${result==='error'&&retry?`&requestId=${encodeURIComponent(retry)}`:''}`);
}
export async function cancelBooking(operatorId:string,orderId:string,form:FormData) {
  let result='cancelled';
  try {
    if(form.get('confirm')!=='yes')throw Error('Confirmation required');
    const reason=form.get('reason');if(typeof reason!=='string')throw Error('Reason required');
    const cancelled=await cancelOrder(operatorId,orderId,reason);
    if(cancelled.refundReviewRequired)result='review';
  }catch{result='error';}
  const path=`/admin/${encodeURIComponent(operatorId)}/bookings`;revalidatePath(path);redirect(`${path}?result=${result}`);
}
