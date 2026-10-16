'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookingDateSelector, BookingPriceIndicator } from './booking-controls';
import { QuantityStepper, useBooking } from './booking';
import { lowestQuotedFare, passengerCaption } from './booking-presentation';
import { passengerKeys } from '@/modules/booking/passengers';
import type { HeroFare } from '@/modules/content/hero-fare';
import styles from './homepage-hero.module.css';
/** Presentation of the existing booking context: no second quote request or checkout. */
export function HeroBookingWidget({fare,productTitle,bookingLabel}:{fare?:HeroFare;productTitle?:string;bookingLabel:string}) {
 const {selection,setSelection,availability,open}=useBooking();
 const counts=selection.passengers??{adult:selection.guests,child:0,infant:0};
 const [dateEdited,setDateEdited]=useState(false);
 const date=dateEdited?selection.date:selection.date||fare?.date||'';
 const quote=availability.quote;
 // Use supplied adult unit prices, never recalculate seasonal/category/capacity rules.
 const quoted=quote?.departures.filter(d=>d.available).flatMap(d=>d.passengerQuote?.lines.filter(l=>l.category==='adult'&&l.quantity>0).map(l=>l.unitPrice)??[])??[];
 const amount=availability.error?undefined:selection.date?lowestQuotedFare(quoted):date?fare?.amount:undefined;
 const canBook=Boolean(date)&&!availability.loading&&!availability.error&&(!quote||quote.departures.some(d=>d.available));
 const caption=passengerKeys.filter(k=>counts[k]>0).map(k=>passengerCaption(k,counts[k])).join(', ')||'Choose passengers';
 return <div className={styles.card} data-floating-obstacle aria-label="Daily ticket availability">{productTitle?<><p className={styles.ticket}>Daily Ticket</p><h2>{productTitle}</h2>
  <form onSubmit={event=>{event.preventDefault();if(!canBook)return;setSelection(current=>({...current,date,departureId:current.date===date?current.departureId:''}));open();}}>
   <div className={styles.fields}><BookingDateSelector value={date} onChange={value=>{setDateEdited(true);setSelection(current=>({...current,date:value,departureId:''}));}}/><details className={styles.passengers}><summary><span>Passengers</span><strong>{caption}</strong><span aria-hidden="true">⌄</span></summary><div><QuantityStepper/></div></details></div>
   <div className={styles.purchase}><div aria-live="polite" aria-busy={availability.loading}><BookingPriceIndicator amount={amount} date={date} currency={quote?.currency??fare?.currency}/>{availability.loading&&<small>Checking your date…</small>}</div><Button type="submit" size="lg" className="p-button p-button-booking" aria-haspopup="dialog" disabled={!canBook}>{bookingLabel}</Button></div>
   {availability.error&&<p className={styles.feedback} role="status">{availability.error}</p>}{!date&&<p className={styles.feedback}>Choose a date to check availability.</p>}
  </form></>:<><BookingPriceIndicator/><p>Ticket availability is temporarily unavailable.</p></>}</div>;
}
