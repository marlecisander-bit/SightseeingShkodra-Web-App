import { StaffPassengers } from "./staff-passengers";
import { withOperatorService } from "@/modules/identity/operator-service";
import type { PassengerCategories,PassengerSnapshot } from "@/modules/booking/passengers";
import { BookingQr } from "@/components/public/booking-pass";
import { Button } from "@/components/ui/button";
import { randomUUID } from "node:crypto";
import { createSessionClient } from "../../modules/identity/supabase-server";
import { requirePermission } from "../../modules/identity/require-permission";
import { hasPermission } from "../../modules/identity/roles";
import {
  manualBooking,
  cancelBooking,
  collectPayment,
  resendConfirmation,
} from "./booking-actions";
import { SubmitButton } from "./submit-button";
import Link from "next/link";
import { MutationForm } from "./mutation-form";
import { prepareServiceDate } from '@/modules/booking/schedules-server';
export async function BookingsPanel({
  operatorId,
  result,
  date,
  email,
  requestId,
  booking: selectedBooking,
}: {
  operatorId: string;
  result?: string;
  date?: string;
  email?: string;
  requestId?: string;
  booking?: string;
}) {
  const context = await requirePermission(operatorId, "bookings.read");
  const client = await createSessionClient();
  const day =
    date &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
      ? date
      : undefined;
  const searchEmail = email?.trim().toLowerCase().slice(0, 254);
  if (hasPermission(context.role, 'departures.manage')) {
    try { await prepareServiceDate(operatorId, day); }
    catch { return <p role="alert">Booking schedules are temporarily unavailable.</p>; }
  }
  let departureChoices = client.from('departures').select('id,product_id,service_date,start_time')
    .eq('operator_id', operatorId).eq('status', 'scheduled');
  departureChoices = day ? departureChoices.eq('service_date',day)
    : departureChoices.gte('service_date',new Date().toISOString().slice(0,10));
  const [customers, departures, products] = await Promise.all([
    searchEmail
      ? client
          .from("customers")
          .select("id,name,email,phone")
          .eq("operator_id", operatorId)
          .eq("email", searchEmail)
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
    departureChoices.order('service_date').order('start_time').limit(100),
    client
      .from("products")
      .select("id,title")
      .eq("operator_id", operatorId)
      .limit(100),
  ]);
  if (customers.error || departures.error || products.error)
    return <p role="alert">Booking data is temporarily unavailable.</p>;
  const categories=hasPermission(context.role,'bookings.create')?await withOperatorService(operatorId,'bookings.create',async(service)=>Object.fromEntries(await Promise.all(products.data.map(async(p)=>{const r=await service.rpc('passenger_categories_v1',{p_product:p.id});if(r.error)throw Error('Passenger categories unavailable');return [p.id,r.data as PassengerCategories];})))):{};
  let ordersQuery = client
    .from("orders")
    .select("id,customer_id,status,total,currency,created_at,collection_mode")
    .eq("operator_id", operatorId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (searchEmail)
    ordersQuery = ordersQuery.in(
      "customer_id",
      customers.data.map((c) => c.id),
    );
  if (selectedBooking && /^[0-9a-f-]{36}$/i.test(selectedBooking)) {
    const selected = await client.from("bookings").select("order_id").eq("operator_id", operatorId).eq("id", selectedBooking).maybeSingle();
    if (selected.error) return <p role="alert">Booking is temporarily unavailable.</p>;
    ordersQuery = ordersQuery.in("id", selected.data ? [selected.data.order_id] : []);
  }
  if (day) {
    const scheduled = await client
      .from("departures")
      .select("id")
      .eq("operator_id", operatorId)
      .eq("service_date", day)
      .limit(1000);
    if (scheduled.error) return <p role="alert">Calendar is unavailable.</p>;
    const items = await client
      .from("booking_items")
      .select("order_id")
      .eq("operator_id", operatorId)
      .in(
        "departure_id",
        scheduled.data.map((d) => d.id),
      )
      .limit(1000);
    if (items.error) return <p role="alert">Calendar is unavailable.</p>;
    ordersQuery = ordersQuery.in(
      "id",
      items.data.map((i) => i.order_id),
    );
  }
  const orders = await ordersQuery;
  if (orders.error)
    return <p role="alert">Orders are temporarily unavailable.</p>;
  const ids = orders.data.map((o) => o.id);
  const [people, bookings, items, payments, holds] = await Promise.all([
    client
      .from("customers")
      .select("id,name,email,phone")
      .eq("operator_id", operatorId)
      .in(
        "id",
        orders.data.map((o) => o.customer_id),
      ),
    client
      .from("bookings")
      .select("id,order_id,booking_reference,status,qr_token,qr_created_at,checked_in_at")
      .eq("operator_id", operatorId)
      .in("order_id", ids),
    client
      .from("booking_items")
      .select("order_id,product_id,departure_id,quantity,status,passenger_snapshot")
      .eq("operator_id", operatorId)
      .in("order_id", ids),
    hasPermission(context.role, "payments.collect")
      ? client
          .from("payments")
          .select("order_id,status,amount,currency")
          .eq("operator_id", operatorId)
          .in("order_id", ids)
      : Promise.resolve({ data: [], error: null }),
    client
      .from("inventory_holds")
      .select("order_id,status,expires_at")
      .eq("operator_id", operatorId)
      .in("order_id", ids),
  ]);
  if (
    people.error ||
    bookings.error ||
    items.error ||
    payments.error ||
    holds.error
  )
    return <p role="alert">Booking details are temporarily unavailable.</p>;
  const itemDepartures = await client.from("departures").select("id,service_date,start_time")
    .eq("operator_id",operatorId).in("id",items.data.map(i=>i.departure_id));
  if(itemDepartures.error) return <p role="alert">Departure details are temporarily unavailable.</p>;
  const deliveries = await client
    .from("notification_deliveries")
    .select("id,booking_id,status,channel,attempt_count,last_error_code,recipient_type,event_type,manual,created_at")
    .eq("operator_id", operatorId)
    .in(
      "booking_id",
      bookings.data.map((b) => b.id),
    ).order("created_at", { ascending: false }).limit(1000);
  const confirmationLabels: Record<string, string> = {
    pending: "Queued",
    leased: "Preparing",
    sending: "Sending",
    retry: "Will retry",
    accepted: "Accepted by provider (delivery not verified)",
    uncertain: "Delivery uncertain - staff review required",
    failed: "Failed - staff review required",
    skipped: "Skipped",
  };
  const messages: Record<string, string> = {
    email_queued: "Confirmation emails queued for the customer and owner. The email worker will process them; check the status below after refreshing.",
    created: "Reservation confirmed. Payment is due at the meeting point.",
    collected: "Full payment recorded at the meeting point.",
    cancelled: "Order cancelled.",
    review:
      "Order cancelled. Refund review requested; no refund has been issued.",
    error:
      "Unable to complete the action. Check availability, configured pricing and customer details, then refresh before retrying.",
  };
  return (
    <div>
      {result && <p role="status">{messages[result] ?? messages.error}</p>}
      <form method="get">
        <label>
          Departure date
          <input type="date" name="date" defaultValue={day} />
        </label>
        <label>
          Customer email (exact match)
          <input type="email" name="email" defaultValue={searchEmail} />
        </label>
        <Button>Find bookings</Button>{" "}
        <Link href={`/admin/${operatorId}/bookings`}>Clear filters</Link>
      </form>
      {searchEmail && (
        <div>
          <h2>Customer lookup</h2>
          {customers.data.length ? (
            customers.data.map((c) => (
              <p key={c.id}>
                {c.name} · {c.email} · {c.phone ?? "No phone"}
              </p>
            ))
          ) : (
            <p>No matching customer.</p>
          )}
        </div>
      )}
      {hasPermission(context.role, "bookings.create") && (
        <details>
          <summary>Create manual booking</summary>
          <p>
            This confirms the seats immediately. Payment is due at the meeting
            point.
          </p>
          <MutationForm action={manualBooking.bind(null, operatorId)}>
            <input
              type="hidden"
              name="request_id"
              value={
                requestId && /^[0-9a-f-]{36}$/i.test(requestId)
                  ? requestId
                  : randomUUID()
              }
            />
            <StaffPassengers departures={departures.data.map(d=>({id:d.id,label:d.service_date+' '+d.start_time+'  |  '+(products.data.find(p=>p.id===d.product_id)?.title??'Product'),categories:categories[d.product_id]}))}/>
            <label>
              Customer name
              <input name="name" maxLength={200} required />
            </label>
            <label>
              Email
              <input name="email" type="email" maxLength={254} required />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" maxLength={50} />
            </label>
            <SubmitButton disabled={departures.data.length === 0}>
              Confirm reservation
            </SubmitButton>
            {departures.data.length === 0 && (
              <p>
                No scheduled departure is available. Schedule a departure before
                creating a booking.
              </p>
            )}
          </MutationForm>
        </details>
      )}
      <h2>Orders</h2>
      {orders.data.length === 0 && <p>No orders match these filters.</p>}
      {orders.data.map((order) => {
        const person = people.data.find((p) => p.id === order.customer_id),
          booking = bookings.data.find((b) => b.order_id === order.id);
        return (
          <details key={order.id} id={booking ? `booking-${booking.id}` : undefined} open={booking?.id === selectedBooking}>
            <summary>
              {booking?.booking_reference ?? order.id} ·{" "}
              {person?.name ?? "Customer"} · {order.status}
            </summary>
            <p>
              {person?.email} {person?.phone}
            </p>
            <p>Order: {order.id}</p>
            <p>
              Total: {order.currency} {(order.total / 100).toFixed(2)}
            </p>
            <p>Booking: {booking?.status ?? "Not prepared"}</p>
            <p>QR status: {booking?.qr_token ? (booking.status==='cancelled'?'Retained - booking cancelled':'Issued'):'Not issued'}. Check-in: {booking?.checked_in_at ? new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Tirane'}).format(new Date(booking.checked_in_at)) : 'Not checked in'}.</p>
            {booking?.qr_token && <BookingQr token={booking.qr_token}/>}
            {deliveries.error ? (
              <p>Confirmation status is temporarily unavailable.</p>
            ) : (
              <div>
                <h3>Booking emails</h3>
                {!deliveries.data.some(d => d.booking_id === booking?.id) && <p>No emails queued yet. Delivery requires configured email settings and a running email worker.</p>}
                <ul>{deliveries.data.filter(d => d.booking_id === booking?.id).slice(0, 10).map(d => <li key={d.id}>
                  {d.recipient_type ?? "Customer"} · {d.event_type?.replaceAll("_", " ") ?? "Confirmation"}{d.manual ? " (manual resend)" : ""}: {confirmationLabels[d.status] ?? d.status} · {d.attempt_count} attempt(s){d.last_error_code ? ` · ${d.last_error_code}` : ""}
                </li>)}</ul>
                <small>Up to ten most recent notifications. Provider acceptance does not verify inbox delivery.</small>
              </div>
            )}
            {booking?.status === "confirmed" && hasPermission(context.role, "bookings.create") && <MutationForm action={resendConfirmation.bind(null, operatorId, booking.id)}>
              <input type="hidden" name="request_id" value={randomUUID()} />
              <label><input type="checkbox" name="confirm" value="yes" required /> Confirm sending the current booking confirmation to the customer and owner</label>
              <SubmitButton>Resend confirmation email</SubmitButton>
            </MutationForm>}
            {holds.data
              .filter((h) => h.order_id === order.id && h.status !== "consumed")
              .map((h, index) => (
                <p key={index}>
                  Hold record: {h.status} · expiry: {h.expires_at}. Unpaid
                  inventory is not reserved beyond this time.
                </p>
              ))}
            <ul>
              {items.data
                .filter((i) => i.order_id === order.id)
                .map((i, index) => (
                  <li key={index}>
                    {products.data.find((p) => p.id === i.product_id)?.title ??
                      i.product_id}{" "}
                    · {i.quantity} passengers · {i.status}
                    {(i.passenger_snapshot as PassengerSnapshot|null)?.lines.map(l=><span key={l.category}> | {l.quantity} {l.category}: EUR {(l.total/100).toFixed(2)}</span>)}
                  </li>
                ))}
            </ul>
            {payments.data
              .filter((p) => p.order_id === order.id)
              .map((p, index) => (
                <p key={index}>
                  Payment: {p.status} · {p.currency}{" "}
                  {(p.amount / 100).toFixed(2)}
                </p>
              ))}
            {order.collection_mode === "meeting_point" && (
              <p>
                {order.status === "cancelled"
                  ? "Reservation cancelled."
                  : payments.data.some(
                        (p) => p.order_id === order.id && p.status === "paid",
                      )
                    ? "Payment received."
                    : "Payment due at the meeting point."}
              </p>
            )}
            {hasPermission(context.role, "payments.collect") &&
              order.collection_mode === "meeting_point" &&
              order.status === "confirmed" &&
              !payments.data.some((p) => p.order_id === order.id) && (
                <MutationForm
                  action={collectPayment.bind(null, operatorId, order.id)}
                >
                  <label>
                    <input
                      type="checkbox"
                      name="received"
                      value="yes"
                      required
                    />{" "}
                    I received the full {order.currency}{" "}
                    {(order.total / 100).toFixed(2)} at the meeting point
                  </label>
                  <SubmitButton>Record payment received</SubmitButton>
                </MutationForm>
              )}
            {hasPermission(context.role, "bookings.cancel") &&
              ["pending", "awaiting_payment", "paid", "confirmed"].includes(
                order.status,
              ) && (
                <MutationForm
                  action={cancelBooking.bind(null, operatorId, order.id)}
                >
                  <label>
                    Cancellation reason
                    <textarea name="reason" maxLength={500} required />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="confirm"
                      value="yes"
                      required
                    />{" "}
                    Confirm cancellation and inventory release
                  </label>
                  <SubmitButton>Cancel order</SubmitButton>
                  <p>
                    Paid orders will be flagged for refund review. This does not
                    issue a refund.
                  </p>
                </MutationForm>
              )}
          </details>
        );
      })}
      <p>
        Showing up to 100 orders and upcoming departures. Date lookup is limited
        to 1,000 departures/items. Only full meeting-point collection can be
        recorded here. Refunds require manual review.
      </p>
    </div>
  );
}
