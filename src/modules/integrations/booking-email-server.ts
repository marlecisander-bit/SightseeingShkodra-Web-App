import "server-only";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { withOperatorService } from "../identity/operator-service";
import { bookingEmailConfig } from "./booking-email-config";
import { bookingEmailStore, processBookingEmails } from "./booking-email-worker";

export function authorizedEmailWorker(header: string | null, secret = process.env.CRON_SECRET): boolean {
  if (!secret || secret.length < 32 || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`), actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function runBookingEmailWorker() {
  const config = bookingEmailConfig();
  if (!config.enabled) { console.info(JSON.stringify({ component: "booking_email", status: "disabled" })); return { status: "disabled", processed: 0 }; }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw Error("email_configuration_invalid");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(5_000) }) } });
  return processBookingEmails(bookingEmailStore(client), config);
}
export async function requestBookingEmail(operatorId: string, bookingId: string, requestId: string) {
  return withOperatorService(operatorId, "bookings.create", async (client, context) => {
    const config = bookingEmailConfig();
    if (!config.enabled || config.operatorId !== context.operatorId) throw Error("Email delivery is not enabled for this workspace.");
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(bookingId) || !uuid.test(requestId)) throw Error("Invalid resend request");
    const { error } = await client.rpc("request_booking_email_v2", { p_operator_id: context.operatorId, p_actor_id: context.staffProfileId, p_booking_id: bookingId, p_request_id: requestId });
    if (error) throw Error("Unable to queue confirmation");
  });
}
