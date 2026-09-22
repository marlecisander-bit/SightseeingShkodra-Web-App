"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createStaffBooking } from "../../modules/booking/staff-booking-server";
import { collectMeetingPointPayment } from "../../modules/booking/collection-server";
import { cancelOrder } from "../../modules/booking/cancellation-server";
export async function manualBooking(operatorId: string, form: FormData) {
  let result = "created";
  try {
    const get = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" ? v : "";
    };
    if (!/^\d+$/.test(get("quantity"))) throw Error("Invalid quantity");
    await createStaffBooking({
      operatorId,
      departureId: get("departure_id"),
      requestId: get("request_id"),
      quantity: Number(get("quantity")),
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
    });
  } catch {
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
