import 'server-only';
import QRCode from 'qrcode';
import { bookingQrMatrix } from '../booking/qr-matrix';
import type { EmailBooking, EmailEnvelope, RecipientType, BookingEmailEvent } from './booking-email-template';
import type { EmailMessage } from './resend-provider';

/** Same raw credential as the booking pass; never sent to a remote QR service. */
export async function bookingEmailAttachments(event: BookingEmailEvent, recipient: RecipientType, booking: EmailBooking, envelope: EmailEnvelope): Promise<EmailMessage['attachments']> {
  if (envelope.version !== 2 || recipient !== 'customer' || event === 'BOOKING_CANCELLED' || booking.status !== 'confirmed' || !booking.qrToken) return undefined;
  bookingQrMatrix(booking.qrToken); // The canonical pass validation/encoding contract.
  const png = await QRCode.toBuffer(booking.qrToken,{type:'png',errorCorrectionLevel:'M',margin:4,scale:6});
  return [{content:png.toString('base64'),filename:'booking-qr.png',content_type:'image/png',content_id:'booking-qr'}];
}
