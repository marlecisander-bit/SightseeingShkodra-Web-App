import type {BookingEmailEvent} from './booking-email-template';
/** Message headers, not API request headers. They cannot force a phone alert. */
export const adminAlertHeaders = {'Importance':'high','X-Priority':'1','X-MSMail-Priority':'High'};
export function adminAlertSubject(event:BookingEmailEvent,reference:string,test=false){
 const label={BOOKING_CREATED:'New booking',BOOKING_MODIFIED:'Booking modified',BOOKING_CANCELLED:'Booking cancelled'}[event];
 const safe=reference.replace(/[\r\n\x00-\x1f\x7f]/g,' ').trim().slice(0,100);
 return `${test?'[TEST] ':''}${label} — ${safe} — Sightseeing Shkodra`;
}
