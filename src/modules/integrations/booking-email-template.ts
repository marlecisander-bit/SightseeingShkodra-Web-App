// Version 1 must remain stable for in-flight provider retries. New designs need a new version.
export type BookingEmailEvent = "BOOKING_CREATED" | "BOOKING_MODIFIED" | "BOOKING_CANCELLED";
export type RecipientType = "customer" | "owner";
export type EmailBooking = {
  reference: string; status: string; name: string; email: string | null; phone: string | null;
  createdAt: string; cancelledAt: string | null; currency: string; total: number;
  collectionMode: string; paid: boolean; paymentStatuses: string[]; refundStatuses: string[]; refundReview: boolean; source: string;
  initiatedBy: string | null; reason: string | null;
  items: { title: string; date: string | null; time: string | null; timezone: string; guests: number }[];
};
export type EmailEnvelope = { version: 1; from: string; owner: string; replyTo: string; siteUrl: string; testRecipient: string | null };
const escape = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const headerText = (v: string) => v.replace(/[\r\n\x00-\x1f\x7f]/g, " ").slice(0, 200);
const labels = {
  BOOKING_CREATED: { customer: "Booking Confirmed", owner: "New Booking" },
  BOOKING_MODIFIED: { customer: "Booking Updated", owner: "Booking Modified" },
  BOOKING_CANCELLED: { customer: "Booking Cancelled", owner: "Booking Cancelled" },
};
export function bookingEmailTemplate(event: BookingEmailEvent, recipient: RecipientType, b: EmailBooking, envelope: EmailEnvelope, operatorId: string, bookingId: string) {
  const title = labels[event][recipient];
  const cancelled = event === "BOOKING_CANCELLED";
  const payment = b.paymentStatuses.length ? b.paymentStatuses.join(", ").replaceAll("_", " ") : b.paid ? "Payment received" : cancelled ? "No payment recorded" : b.collectionMode === "meeting_point" ? "Payment due at the meeting point" : "Payment not recorded";
  const rows: [string, string][] = [["Booking reference", b.reference], ["Customer", b.name], ["Booking status", b.status]];
  if (recipient === "owner") {
    if (b.email) rows.push(["Customer email", b.email]);
    if (b.phone) rows.push(["Customer phone", b.phone]);
    rows.push(["Booked at", b.createdAt], ["Booking source", b.source]);
    if (b.initiatedBy) rows.push(["Initiated by", b.initiatedBy]);
  }
  for (const item of b.items) {
    rows.push([cancelled ? "Cancelled service" : "Service", item.title]);
    if (item.date) rows.push(["Service date", item.date]);
    if (item.time) rows.push(["Departure time", `${item.time.slice(0,5)} (${item.timezone})`]);
    rows.push(["Passengers", String(item.guests)]);
  }
  rows.push(["Total", `${b.currency} ${(b.total / 100).toFixed(2)}`], ["Payment", payment]);
  if (cancelled && b.cancelledAt) rows.push(["Cancelled at", b.cancelledAt]);
  if (cancelled && b.reason) rows.push(["Cancellation reason", b.reason]);
  if (cancelled && b.refundStatuses.length) rows.push(["Refund status", b.refundStatuses.join(", ").replaceAll("_", " ")]);
  const instruction = cancelled
    ? b.refundReview ? "A refund review has been requested. This does not confirm that a refund has been issued." : "Any applicable refund will be handled according to the booking and payment conditions."
    : event === "BOOKING_MODIFIED" ? "Your booking has been updated. The current booking details are shown below."
    : "Your booking is confirmed. Please keep your booking reference for your visit.";
  const adminUrl = `${envelope.siteUrl}/admin/${encodeURIComponent(operatorId)}/bookings?booking=${encodeURIComponent(bookingId)}#booking-${encodeURIComponent(bookingId)}`;
  const testNotice = envelope.testRecipient ? `TEST EMAIL - ${recipient} notification. Redirected to the configured test mailbox.` : "";
  const text = [testNotice, "Sightseeing Shkodra", title.toUpperCase(), instruction, ...rows.map(([k,v]) => `${k}: ${v}`), recipient === "owner" ? `Open booking: ${adminUrl}` : "", `Questions? Reply to ${envelope.replyTo}.`].filter(Boolean).join("\n\n");
  const html = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>${escape(title)}</title></head><body style="margin:0;padding:16px;background:#f5f5f5;color:#262626;font:16px Arial,sans-serif;line-height:1.5"><table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:#fff"><tr><td style="padding:24px;border-top:6px solid #B91546"><p style="font-weight:bold;color:#9D103A;margin:0 0 20px">SIGHTSEEING SHKODRA</p>${testNotice ? `<p>${escape(testNotice)}</p>` : ""}<h1 style="font-size:24px;line-height:1.25">${escape(title.toUpperCase())}</h1><p>${escape(instruction)}</p><table role="presentation" style="width:100%;border-collapse:collapse;table-layout:fixed">${rows.map(([k,v]) => `<tr><td style="padding:10px 6px;border-bottom:1px solid #eee;width:38%;vertical-align:top;font-size:14px;color:#555;overflow-wrap:anywhere">${escape(k)}</td><td style="padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top;overflow-wrap:anywhere;word-break:break-word">${escape(v)}</td></tr>`).join("")}</table>${recipient === "owner" ? `<p style="margin:24px 0"><a href="${escape(adminUrl)}" style="display:inline-block;background:#9D103A;color:#fff;text-align:center;text-decoration:none;padding:14px 22px;border-radius:6px;font-weight:bold">Open booking</a></p>` : ""}<p style="font-size:14px;color:#555;margin-top:24px">Questions? Reply to <a href="mailto:${escape(envelope.replyTo)}" style="color:#9D103A">${escape(envelope.replyTo)}</a>.</p></td></tr></table></body></html>`;
  const subject = `${envelope.testRecipient ? "[TEST] " : ""}${title} — ${recipient === "customer" ? "Sightseeing Shkodra — " : ""}${headerText(b.reference)}${recipient === "owner" ? ` — ${headerText(b.name)}` : ""}`;
  return { subject, html, text };
}
