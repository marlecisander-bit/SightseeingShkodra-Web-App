import { meetingPoint } from "@/modules/booking/meeting-point";
import { passengerLabels } from "@/modules/booking/passengers";
import type { PendingOrder } from '@/modules/booking/contracts';
import { bookingQrMatrix } from '@/modules/booking/qr-matrix';
import styles from './booking-pass.module.css';
export function BookingQr({token}:{token:string}) {
  const matrix=bookingQrMatrix(token),quiet=4,size=matrix.size+quiet*2;
  let path='';
  for(let y=0;y<matrix.size;y++)for(let x=0;x<matrix.size;x++)if(matrix.get(y,x))path+='M'+(x+quiet)+' '+(y+quiet)+'h1v1h-1z';
  return <svg className={styles.qr} role="img" aria-label="Your unique booking QR code" viewBox={'0 0 '+size+' '+size} width="205" height="205" shapeRendering="crispEdges"><rect width={size} height={size} fill="#fff"/><path d={path} fill="#000"/></svg>;
}
export function BookingPassCard({order}:{order:PendingOrder}) {
  const confirmed=order.bookingStatus==='confirmed';
  return <section className={styles.pass} aria-label="Booking pass">
    <div className={styles.confirmation} aria-hidden="true">{confirmed?'✓':'!'}</div>
    <h3>{confirmed?'Your seats are confirmed':'Booking '+(order.bookingStatus??order.status)}</h3>
    <div>{order.items.flatMap(i=>i.passengerSnapshot?.lines??[]).map((l,i)=><p key={i}>{l.quantity} {passengerLabels[l.category]}  |  {new Intl.NumberFormat("en-GB",{style:"currency",currency:order.currency}).format(l.total/100)}</p>)}</div><div className={styles.facts}>{order.pass?.departures.map((d,i)=><div key={i}><strong>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d.date+'T12:00:00Z'))}</strong><span>{d.time.slice(0,5)} | {d.guests} {d.guests===1?'guest':'guests'}</span></div>)}<strong>{new Intl.NumberFormat('en-GB',{style:'currency',currency:order.currency}).format(order.total/100)}</strong></div>
    {order.pass ? <BookingQr token={order.pass.token}/> : <p role="status">Your booking is saved. Reload this page to retrieve your QR pass.</p>}
    <h4>Your booking pass</h4>
    <p>{confirmed?'Show this QR code to our staff when you arrive.':'This booking is not valid for boarding. Contact staff for assistance.'}</p>
    <p className={styles.reference}>Booking reference<br/><strong>{order.bookingReference??order.orderId}</strong></p>
    {order.pass?.checkedInAt&&<p>Checked in: {new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Tirane'}).format(new Date(order.pass.checkedInAt))}</p>}
    <p className={styles.payment}>{order.status==='cancelled'?'Reservation cancelled.':order.paymentStatus==='paid'?'Payment received.':'Payment due at the meeting point.'}</p>
    <p>Occupied seats: {order.items.reduce((n,i)=>n+(i.passengerSnapshot?i.passengerSnapshot.counts.adult+i.passengerSnapshot.counts.child:i.quantity),0)}</p>
    <p><a href={meetingPoint.url} target="_blank" rel="noreferrer">{meetingPoint.label}</a></p>
    {order.managementToken&&<a className="p-button p-button-booking" href={"/booking/manage#token="+order.managementToken}>Manage booking</a>}
    <p className={styles.instructions}>Keep your booking pass and private management link. Online changes close 15 minutes before departure.</p>
  </section>;
}
