import { bookingEmailTemplate, type BookingEmailEvent, type EmailBooking, type EmailEnvelope, type RecipientType } from "./booking-email-template";
/** Synthetic fixtures only. Never used by the delivery worker. */
export function bookingEmailPreview(event: BookingEmailEvent, recipient: RecipientType, siteUrl = '') {
  const booking: EmailBooking = { reference: "SS-PREVIEW-ONLY", status: event === "BOOKING_CANCELLED" ? "cancelled" : "confirmed", name: "Ada Example", email: "guest@example.invalid", phone: null, createdAt: "2030-06-01T08:15:00Z", cancelledAt: event === "BOOKING_CANCELLED" ? "2030-06-02T10:00:00Z" : null, currency: "EUR", total: 2500, collectionMode: "meeting_point", paid: false, paymentStatuses: [], refundStatuses: [], refundReview: false, source: "Online", initiatedBy: null, reason: null, items: [{ title: "Preview sightseeing tour", date: "2030-06-10", time: "09:00:00", timezone: "Europe/Tirane", guests: 3, seats: 2, counts: { adult: 1, child: 1, infant: 1 } }] };
  const envelope: EmailEnvelope = { version: 2, from: "Sightseeing Shkodra <bookings@example.invalid>", owner: "owner@example.invalid", replyTo: "reply@example.invalid", siteUrl, testRecipient: "qa@example.invalid" };
  return bookingEmailTemplate(event, recipient, booking, envelope, "preview", "preview");
}
