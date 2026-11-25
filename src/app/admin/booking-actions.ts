"use server";
import { passengerCount,adultRequired } from "@/modules/booking/passengers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createStaffBooking } from "../../modules/booking/staff-booking-server";
import { collectMeetingPointPayment } from "../../modules/booking/collection-server";
import { cancelOrder } from "../../modules/booking/cancellation-server";
import { requestBookingEmail } from "../../modules/integrations/booking-email-server";
export async function resendConfirmation(operatorId: string, bookingId: string, form: FormData) {
  try {
    if (form.get("confirm") !== "yes") throw Error("Confirmation required");
    const request = form.get("request_id");
    if (typeof request !== "string") throw Error("Request required");
    await requestBookingEmail(operatorId, bookingId, request);
  } catch {
    return { error: "Confirmation could not be requested. Check that email sending is on and the booking is confirmed. Wait five minutes after the last resend before trying again." };
  }
  const path = `/admin/${encodeURIComponent(operatorId)}/bookings`;
  revalidatePath("/","layout");
  redirect(`${path}?result=email_queued&booking=${encodeURIComponent(bookingId)}#booking-${encodeURIComponent(bookingId)}`);
}
export async function manualBooking(operatorId: string, form: FormData) {
  let result = "created";
  try {
    const get = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" ? v : "";
    };
    const passengers={adult:Number(get("adult")),child:Number(get("child")),infant:Number(get("infant"))};
    const quantity=passengerCount(passengers);
    await createStaffBooking({
      operatorId,
      productId: get("product_id")||undefined,
      departureId: get("departure_id"),
      requestId: get("request_id"),
      quantity,passengers,
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
    });
  } catch(e) {
    if(e instanceof Error&&e.message===adultRequired)return {error:adultRequired};
    result = "error";
  }
  if (result === "error")
    return {
      error:
        "Unable to create the booking. Your details and retry ID are preserved. Check the order list after an uncertain result, then verify availability, pricing and customer details before retrying.",
    };
  const path = `/admin/${encodeURIComponent(operatorId)}/bookings`;
  revalidatePath("/","layout");
  redirect(`${path}?result=${result}`);
}
export async function cancelBooking(
  operatorId: string,
  orderId: string,
  form: FormData,
) {
  let result = "cancelled";
  try {
    if (form.get("confirm") !== "yes") throw Error("Confirmation required");
    const reason = form.get("reason");
    if (typeof reason !== "string") throw Error("Reason required");
    const cancelled = await cancelOrder(operatorId, orderId, reason);
    if (cancelled.refundReviewRequired) result = "review";
  } catch {
    result = "error";
  }
  if (result === "error")
    return {
      error:
        "Cancellation was not completed. Your reason is preserved. Review the current order and your permissions before retrying.",
    };
  const path = `/admin/${encodeURIComponent(operatorId)}/bookings`;
  revalidatePath("/","layout");
  redirect(`${path}?result=${result}`);
}

export async function collectPayment(
  operatorId: string,
  orderId: string,
  form: FormData,
) {
  try {
    if (form.get("received") !== "yes")
      throw Error("Receipt confirmation required");
    await collectMeetingPointPayment(operatorId, orderId);
  } catch {
    return {
      error:
        "Payment was not recorded. Check the booking and whether the full amount was received, then retry. Repeating this action does not create a second receipt.",
    };
  }
  const path = `/admin/${encodeURIComponent(operatorId)}/bookings`;
  revalidatePath("/","layout");
  redirect(`${path}?result=collected`);
}

/** Explicit UI preparation replaces the old render-time call. Domain logic is unchanged. */
export async function loadBookingDepartures(operatorId:string,form:FormData){
  return prepareBookingDepartures(operatorId,null,form);
}

export async function loadWalkInDepartures(operatorId:string,returnTo:string,form:FormData){
  return prepareBookingDepartures(operatorId,returnTo,form);
}

async function prepareBookingDepartures(operatorId:string,returnTo:string|null,form:FormData){
  const {requirePermission}=await import('@/modules/identity/require-permission');
  const {prepareServiceDate}=await import('@/modules/booking/schedules-server');
  const {validBookingDay}=await import('./bookings-presentation');
  const value=form.get('date'),day=typeof value==='string'?validBookingDay(value):undefined;
  try{
    await requirePermission(operatorId,'bookings.create');
    if(!day)throw Error('Choose a valid date');
    await prepareServiceDate(operatorId,day);
  }catch{return {error:'Departures could not be loaded. Check the service date and your scheduling access before retrying.'};}
  const path=`/admin/${encodeURIComponent(operatorId)}/bookings`;
  revalidatePath("/","layout");
  const departurePath=`/admin/${encodeURIComponent(operatorId)}/departures?view=agenda&date=${day}&schedule=`;
  if(returnTo?.startsWith(departurePath)&&/^[a-z0-9-]+&time=[0-9%:]+$/i.test(returnTo.slice(departurePath.length)))redirect(returnTo+'&walkIn=1#new-booking');
  redirect(`${path}?date=${day}&create=1&result=departures_ready#new-booking`);
}


export async function deleteBooking(operatorId:string,bookingId:string,form:FormData){
 try{
  if(form.get('confirm')!=='yes')return {error:'Confirm permanent deletion before continuing.'};
  const reference=form.get('reference'),reason=form.get('reason');
  if(typeof reference!=='string'||typeof reason!=='string')return {error:'Enter the booking reference and a reason.'};
  const {deleteBookingRecord}=await import('@/modules/booking/deletion-server');
  await deleteBookingRecord(operatorId,bookingId,reference,reason);
 }catch(error){
  const {BookingDeletionError}=await import('@/modules/booking/deletion-server');
  return {error:error instanceof BookingDeletionError&&error.code==='BUSY'?'A payment or message delivery is in progress. Wait for it to finish, then retry.':error instanceof BookingDeletionError&&error.code==='NOT_FOUND'?'The booking reference does not match. Review it and retry.':'Booking was not deleted. Check your owner access, the reference and the latest booking details.'};
 }
 const path=`/admin/${encodeURIComponent(operatorId)}/bookings`;
 revalidatePath("/","layout");revalidatePath(`/admin/${encodeURIComponent(operatorId)}/overview`);revalidatePath(`/admin/${encodeURIComponent(operatorId)}/departures`);
 redirect(`${path}?result=deleted`);
}

/** Uses the existing locked booking-pass write. Attendance is recorded on the party. */
export async function checkInDepartureParty(operatorId:string,departureId:string,bookingId:string,form:FormData){
  if(form.get('confirm')!=='yes')return {error:'Confirm that this party has arrived.'};
  return recordDepartureCheckIn(operatorId,departureId,{bookingId});
}

export async function checkInDepartureTicket(operatorId:string,departureId:string,form:FormData){
  const token=form.get('ticket');
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/i.test(token.trim()))return {error:'Scan a valid ticket code.'};
  return recordDepartureCheckIn(operatorId,departureId,{token:token.trim().toLowerCase()});
}

async function recordDepartureCheckIn(operatorId:string,departureId:string,pass:{bookingId:string}|{token:string}){
  const {withOperatorService}=await import('@/modules/identity/operator-service');
  const {resolveBookingPass}=await import('@/modules/booking/pass-server');
  try{
    const token=await withOperatorService(operatorId,'bookings.create',async client=>{
      const query=client.from('bookings').select('order_id,qr_token').eq('operator_id',operatorId).eq('status','confirmed');
      const booking=await ('bookingId' in pass?query.eq('id',pass.bookingId):query.eq('qr_token',pass.token)).single();
      if(booking.error||!booking.data.qr_token)throw Error('Pass unavailable');
      const item=await client.from('booking_items').select('order_id').eq('operator_id',operatorId).eq('order_id',booking.data.order_id).eq('departure_id',departureId).eq('status','confirmed').limit(1).maybeSingle();
      if(item.error||!item.data)throw Error('Party unavailable');
      return booking.data.qr_token as string;
    });
    const outcome=await resolveBookingPass(operatorId,token,true);
    if(!['CHECKED_IN','ALREADY_CHECKED_IN'].includes(outcome.status))throw Error('Check-in unavailable');
    const root=`/admin/${encodeURIComponent(operatorId)}`;
    revalidatePath(root+'/departures');
    revalidatePath(root+'/overview');
    revalidatePath(root+'/bookings');
  }catch{return {error:'Check-in could not be recorded. Verify that the booking is confirmed for this departure.'};}
}
