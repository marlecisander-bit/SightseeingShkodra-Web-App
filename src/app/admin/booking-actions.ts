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
    return { error: "Confirmation could not be queued. Email delivery must be configured and enabled. Check that this booking is confirmed, or wait five minutes after the last manual resend. The retry ID is preserved." };
  }
  const path = `/admin/${encodeURIComponent(operatorId)}/bookings`;
  revalidatePath(path);
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
  revalidatePath(path);
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
  revalidatePath(path);
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
  revalidatePath(path);
  redirect(`${path}?result=collected`);
}
