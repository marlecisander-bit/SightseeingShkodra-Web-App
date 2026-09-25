import { notFound } from "next/navigation";
import { bookingEmailPreview } from "@/modules/integrations/booking-email-preview";
export default function BookingEmailPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
    <h1 style={{ fontSize: 28 }}>Booking email previews</h1>
    <p>Synthetic examples only. No booking data is read and no email is sent.</p>
    {(["BOOKING_CREATED", "BOOKING_MODIFIED", "BOOKING_CANCELLED"] as const).flatMap(event => (["customer", "owner"] as const).map(recipient => {
      const email = bookingEmailPreview(event, recipient);
      return <section key={`${event}-${recipient}`}><h2 style={{ fontSize: 20, overflowWrap: "anywhere" }}>{event} / {recipient}</h2><p>{email.subject}</p><iframe title={`${event} ${recipient}`} sandbox="" srcDoc={email.html} style={{ width: "100%", height: 1050, border: "1px solid #ddd" }} /><details><summary>Plain-text version</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{email.text}</pre></details></section>;
    }))}
  </main>;
}
