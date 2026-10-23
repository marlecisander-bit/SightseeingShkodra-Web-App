import {bookingQrMatrix} from "../booking/qr-matrix";
import { bookingEmailTemplate, type BookingEmailEvent, type EmailBooking, type EmailEnvelope, type RecipientType } from "./booking-email-template";
/** Synthetic fixtures only. Never used by the delivery worker. */
export function bookingEmailPreview(event: BookingEmailEvent, recipient: RecipientType, siteUrl = '') {
  const booking: EmailBooking = { reference: "SS-PREVIEW-ONLY", status: event === "BOOKING_CANCELLED" ? "cancelled" : "confirmed", name: "Ada Example", email: "guest@example.invalid", phone: null, createdAt: "2030-06-01T08:15:00Z", cancelledAt: event === "BOOKING_CANCELLED" ? "2030-06-02T10:00:00Z" : null, currency: "EUR", total: 2500, collectionMode: "meeting_point", paid: false, paymentStatuses: [], refundStatuses: [], refundReview: false, source: "Online", initiatedBy: null, reason: null, items: [{ title: "Preview sightseeing tour", date: "2030-06-10", time: "09:00:00", timezone: "Europe/Tirane", guests: 3, seats: 2, counts: { adult: 1, child: 1, infant: 1 } }] };
  const envelope: EmailEnvelope = { version: 2, from: "Sightseeing Shkodra <bookings@example.invalid>", owner: "owner@example.invalid", replyTo: "reply@example.invalid", siteUrl, testRecipient: "qa@example.invalid" };
  if(event==='BOOKING_CREATED'&&recipient==='customer'){
    envelope.customerConfirmationDesign=3;
    booking.managementToken='a'.repeat(64);booking.qrToken='b'.repeat(64);
    booking.meetingPoint={name:'Synthetic boarding point',directions:'Example Square 1, Shkodra — preview only',url:'https://maps.app.goo.gl/PreviewOnly',label:'Open meeting point',stopId:null};
    // Preview only: browser SVG of the same synthetic payload. Real delivery keeps the PNG CID.
    const matrix=bookingQrMatrix(booking.qrToken),size=matrix.size+8;
    let path='';for(let y=0;y<matrix.size;y++)for(let x=0;x<matrix.size;x++)if(matrix.get(y,x))path+=`M${x+4} ${y+4}h1v1h-1z`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="black"/></svg>`;
    const result=bookingEmailTemplate(event,recipient,booking,envelope,'preview','preview');
    return {...result,html:result.html.replace('cid:booking-qr','data:image/svg+xml,'+encodeURIComponent(svg))};
  }
  return bookingEmailTemplate(event, recipient, booking, envelope, "preview", "preview");
}
