import type {ReactNode} from 'react';
import Link from 'next/link';
import {BookingOpenLabel} from './booking-open-label';
import {BookingCard} from './booking-card';
import {AdminIcon} from './admin-icon';
import {AdminStatus} from './admin-status';
import {ownerStatus} from './presentation';
import {passengerLabels} from '@/modules/booking/passengers';
import {bookingAmount,bookingPaymentLabel,type BookingRecordView} from './bookings-presentation';
import styles from './bookings.module.css';
export function BookingRecord({operatorId,row,selected=false,actions,communications,qr,holdNotes}:{operatorId:string;row:BookingRecordView;selected?:boolean;actions?:ReactNode;communications?:ReactNode;qr?:ReactNode;holdNotes?:ReactNode}){
 const root=`/admin/${encodeURIComponent(operatorId)}`,href=row.bookingId?`${root}/bookings?booking=${encodeURIComponent(row.bookingId)}`:undefined;
 const summary=<div className={styles.summary}><span className={styles.guest}><span className={styles.avatar}><AdminIcon name="users" size={18}/></span><span><strong>{row.name}</strong><small>{row.reference}</small></span></span><span className={styles.tourSummary}>{row.items.map((item,i)=><span key={i}><span>{item.date??'Date unavailable'} <b>{item.time?.slice(0,5)}</b></span><small>{item.quantity} passengers · {item.seats} seats</small></span>)}</span><span className={styles.statuses}><span><AdminStatus status={row.status}>{ownerStatus(row.status)}</AdminStatus></span><small>Payment: {bookingPaymentLabel(row)}</small></span><span className={styles.value}><strong>{bookingAmount(row.total,row.currency)}</strong><span className={styles.open}>{href?<BookingOpenLabel/>:<>View booking <AdminIcon name="arrow-right" size={16}/></>}</span></span></div>;
 if(href&&!selected)return <article className={styles.row}><Link prefetch={false} href={href} className={styles.cardLink} aria-label={`View booking ${row.reference} for ${row.name}`}>{summary}</Link></article>;
 return <BookingCard id={row.bookingId??row.id} initiallyOpen={selected} summary={selected?<div className={styles.detailSummary}><div><small>Reservation details</small><h2>{row.reference}</h2><span>{row.name}</span></div><AdminStatus status={row.status}>{ownerStatus(row.status)}</AdminStatus></div>:summary}>
  {(selected||!href)?<div className={styles.detail}>
   <div className={styles.detailGrid}>
    <section className={styles.section}><h3><AdminIcon name="users" size={18}/>Guest</h3><strong>{row.name}</strong>{row.email&&<p><a href={`mailto:${row.email}`}>{row.email}</a></p>}{row.phone&&<p><a href={`tel:${row.phone}`}>{row.phone}</a></p>}<p>Reservation: {ownerStatus(row.status)}</p></section>
    <section className={styles.section}><h3><AdminIcon name="bus-front" size={18}/>Tour &amp; passengers</h3>{row.items.map((item,index)=><div key={index} className={styles.item}><strong>{item.product}</strong><p>{item.date??'Date unavailable'} · {item.time?.slice(0,5)??'Time unavailable'}</p><p>{item.quantity} passengers · {item.seats} occupied seats · {ownerStatus(item.status)}</p>{item.snapshot?<ul>{item.snapshot.lines.map(line=><li key={line.category}>{line.quantity} {passengerLabels[line.category]} · {bookingAmount(line.total,row.currency)}</li>)}</ul>:<p>Passenger category breakdown unavailable for this reservation.</p>}{item.date&&<Link prefetch={false} href={`${root}/departures?date=${item.date}&fromBookings=1`}>View departure in calendar <AdminIcon name="arrow-right" size={16}/></Link>}</div>)}</section>
    <section className={styles.section}><h3><AdminIcon name="tags" size={18}/>Payment</h3><strong className={styles.total}>{bookingAmount(row.total,row.currency)}</strong><p>Payment: {bookingPaymentLabel(row)}</p>{row.payments.map((p,index)=><p key={index}>{ownerStatus(p.status)} · {bookingAmount(p.amount,p.currency)}</p>)}<small>Booked value, separate from recorded payment.</small></section>
    <section className={styles.section}><h3><AdminIcon name="mail" size={18}/>Communications</h3>{communications??<p>Communication status unavailable.</p>}</section>
    <section className={styles.section}><h3><AdminIcon name="ticket" size={18}/>Booking pass</h3><p>QR: {row.hasQr?(row.status==='cancelled'?'Retained · cancelled reservation':'Issued'):'Not issued'}.</p><p>Check-in: {row.checkedInAt?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Tirane'}).format(new Date(row.checkedInAt)):'Not checked in'}.</p>{qr}{holdNotes}</section>
    <section className={`${styles.section} ${styles.actions}`}><h3>Reservation actions</h3>{actions??<p>No supported actions are available for this reservation.</p>}</section>
   </div><details className={styles.technical}><summary>Technical reference</summary><p>Order: {row.id}</p></details>
  </div>:<p className={styles.inlineLink}><Link prefetch={false} href={href}>Open canonical booking details</Link></p>}
 </BookingCard>;
}
