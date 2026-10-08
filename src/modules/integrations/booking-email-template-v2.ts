import { meetingPoint as historicalMeetingPoint } from '../booking/meeting-point';
import type { BookingEmailEvent, EmailBooking, EmailEnvelope, RecipientType } from './booking-email-template';

// Keep this rendering stable for retries carrying envelope.version=2.
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
const header = (value: string) => value.replace(/[\r\n\x00-\x1f\x7f]/g, ' ').slice(0, 200);
const money = (b: EmailBooking, amount = b.total) => `${b.currency} ${(amount / 100).toFixed(2)}`;
export function bookingEmailTemplateV2(event: BookingEmailEvent, recipient: RecipientType, b: EmailBooking, envelope: EmailEnvelope, operatorId: string, bookingId: string) {
  const meetingPoint = b.meetingPoint ?? historicalMeetingPoint;
  const cancelled = event === 'BOOKING_CANCELLED';
  const title = event === 'BOOKING_CREATED' ? recipient === 'customer' ? 'BOOKING CONFIRMED' : 'NEW BOOKING' : event === 'BOOKING_MODIFIED' ? 'BOOKING UPDATED' : 'BOOKING CANCELLED';
  const subject = recipient === 'customer'
    ? `${event === 'BOOKING_CREATED' ? 'Your Sightseeing Shkodra Ticket' : event === 'BOOKING_MODIFIED' ? 'Your Sightseeing Shkodra Booking Has Been Updated' : 'Your Sightseeing Shkodra Booking Has Been Cancelled'} — ${header(b.reference)}`
    : `${event === 'BOOKING_CREATED' ? 'NEW BOOKING' : event === 'BOOKING_MODIFIED' ? 'BOOKING MODIFIED' : 'BOOKING CANCELLED'} — ${header(b.reference)}${event === 'BOOKING_CREATED' && b.items[0]?.date ? ` — ${header(b.items[0].date)}` : ''}`;
  const rows: [string,string][] = [['Booking reference',b.reference],['Customer',b.name],['Booking status',b.status]];
  if (recipient === 'owner') {
    if (b.email) rows.push(['Customer email',b.email]);
    if (b.phone) rows.push(['Customer phone',b.phone]);
    rows.push(['Booking date/time',b.createdAt]);
  }
  for (const item of b.items) {
    rows.push(['Service',item.title]);
    if (!cancelled && item.description) rows.push(['About your ticket',item.description]);
    if (!cancelled && item.inclusions) rows.push(['Ticket includes',item.inclusions]);
    if (item.date) rows.push(['Service date',item.date]);
    if (item.time) rows.push(['Departure time',`${item.time.slice(0,5)} (${item.timezone})`]);
    if (item.counts) rows.push(['Adults',String(item.counts.adult)],['Children',String(item.counts.child)],['Infants',String(item.counts.infant)]);
    rows.push(['Total passengers',String(item.guests)]);
    if (item.seats !== undefined) rows.push([cancelled ? 'Seats released' : 'Seats occupied',String(item.seats)]);
  }
  rows.push(['Total',money(b)],['Payment',b.paymentStatuses.length ? b.paymentStatuses.join(', ').replaceAll('_',' ') : b.paid ? 'Payment received' : cancelled ? 'No payment recorded' : b.collectionMode === 'meeting_point' ? 'Payment due at the meeting point' : 'Payment not recorded']);
  if (!cancelled && b.meetingPoint) rows.push(["Meeting point",meetingPoint.name],["Directions",meetingPoint.directions]);
  if (cancelled && b.cancelledAt) rows.push(['Cancellation timestamp',b.cancelledAt]);
  if (cancelled && b.reason) rows.push(['Cancellation reason',b.reason]);
  const changes: [string,string][] = [];
  const current = b.items[0], previous = b.previous;
  if (event === 'BOOKING_MODIFIED' && previous && b.items.length === 1 && current) {
    if (previous.date !== current.date) changes.push(['Service date',`${previous.date ?? 'Not recorded'} → ${current.date ?? 'Not recorded'}`]);
    if (previous.time !== current.time) changes.push(['Departure',`${previous.time?.slice(0,5) ?? 'Not recorded'} → ${current.time?.slice(0,5) ?? 'Not recorded'}`]);
    if (current.counts) for (const key of ['adult','child','infant'] as const) if (previous.counts[key] !== current.counts[key]) changes.push([key,`${previous.counts[key]} → ${current.counts[key]}`]);
    if (previous.total !== b.total) changes.push(['Total',`${money(b,previous.total)} → ${money(b)}`]);
  }
  const manage = b.managementToken && /^[a-f0-9]{64}$/.test(b.managementToken) ? `${envelope.siteUrl}/booking/manage#token=${b.managementToken}` : null;
  const links: [string,string][] = recipient === 'owner'
    ? [['OPEN BOOKING IN ADMIN',`${envelope.siteUrl}/admin/${encodeURIComponent(operatorId)}/bookings?booking=${encodeURIComponent(bookingId)}#booking-${encodeURIComponent(bookingId)}`]]
    : cancelled ? [['BOOK AGAIN',`${envelope.siteUrl}/book`]] : [...(manage ? [['VIEW BOOKING',manage],['MODIFY BOOKING',manage]] as [string,string][] : []),['LIVE MAP',`${envelope.siteUrl}/route`]];
  const qr = recipient === 'customer' && !cancelled && b.status === 'confirmed' && /^[a-f0-9]{64}$/.test(b.qrToken ?? '');
  const notice = cancelled ? 'This booking is cancelled and is no longer a valid ticket. Any applicable refund is handled according to your booking and payment conditions.' : 'Show your booking QR or reference when boarding. Adults and children each occupy one seat. Infants do not occupy seats.';
  const test = envelope.testRecipient ? `TEST EMAIL — ${recipient} notification. Redirected to the approved test mailbox.` : '';
  const table = (values: [string,string][]) => `<table role="presentation" width="100%" style="border-collapse:collapse;table-layout:fixed">${values.map(([key,value])=>`<tr><td width="40%" style="padding:10px 6px;border-bottom:1px solid #DED5CB;vertical-align:top;color:#625D65;overflow-wrap:anywhere">${escape(key)}</td><td style="padding:10px 6px;border-bottom:1px solid #DED5CB;vertical-align:top;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join('')}</table>`;
  const text = [test,'Sightseeing Shkodra',title,notice,...rows.map(([k,v])=>`${k}: ${v}`),...changes.map(([k,v])=>`Previous → New ${k}: ${v}`),!cancelled ? `${meetingPoint.label}: ${meetingPoint.url}` : '',qr ? 'Your booking QR is included in this email. Staff verify its current booking status when scanned.' : '',...links.map(([label,url])=>`${label}: ${url}`),`Questions? Reply to ${envelope.replyTo}.`].filter(Boolean).join('\n\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;padding:16px;background:#FFF8EE;color:#25232A;font:16px Arial,Helvetica,sans-serif;line-height:1.5"><table role="presentation" width="100%" style="max-width:600px;margin:auto;border-collapse:collapse;background:#fff"><tr><td style="padding:24px;background:#B91546"><img src="${escape(envelope.siteUrl)}/brand/email-logo-v2.png" width="220" alt="Sightseeing Shkodra" style="display:block;width:220px;max-width:100%;height:auto"></td></tr><tr><td style="padding:24px">${test ? `<p>${escape(test)}</p>` : ''}<h1 style="font-size:24px;line-height:1.2;color:#9D103A">${title}</h1><p>${escape(notice)}</p>${table(rows)}${changes.length ? `<h2 style="font-size:20px">Previous → New</h2>${table(changes)}` : ''}${qr ? '<p style="text-align:center"><img src="cid:booking-qr" width="240" height="240" alt="Booking QR — show this to boarding staff" style="width:240px;max-width:100%;height:auto"></p><p>Staff verify the current booking status when scanned.</p>' : ''}${!cancelled ? `<p><a href="${escape(meetingPoint.url)}" style="color:#9D103A">${escape(meetingPoint.label)}</a></p>` : ''}${links.map(([label,url])=>`<p><a href="${escape(url)}" style="display:inline-block;padding:14px 20px;background:#F6C928;color:#25232A;text-decoration:none;font-weight:bold;border-radius:6px">${label}</a></p>`).join('')}<p style="font-size:14px;color:#625D65">Questions? Reply to <a href="mailto:${escape(envelope.replyTo)}" style="color:#9D103A">${escape(envelope.replyTo)}</a>.</p></td></tr></table></body></html>`;
  return {subject:`${test ? '[TEST] ' : ''}${subject}`,html,text};
}
