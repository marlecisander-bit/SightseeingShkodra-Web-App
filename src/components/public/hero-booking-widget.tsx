'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookingDateSelector, BookingPriceIndicator } from './booking-controls';
import { QuantityStepper, useBooking } from './booking';
import { bookingMoney, lowestQuotedFare, passengerCaption } from './booking-presentation';
import { passengerKeys } from '@/modules/booking/passengers';
import type { HeroFare } from '@/modules/content/hero-fare';
import styles from './homepage-hero.module.css';
import {reservationLabel} from '@/modules/booking/products';
/** Presentation of the existing booking context: no second quote request or checkout. */
export function HeroBookingWidget({fare,productTitle,bookingLabel,embedded=false}:{embedded?:boolean;fare?:HeroFare;productTitle?:string;bookingLabel:string}) {
 const {selection,setSelection,availability,open,product}=useBooking();
 const counts=selection.passengers??{adult:selection.guests,child:0,infant:0};
 const passengerPanel=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const dismiss=(event:PointerEvent)=>{if(!passengerPanel.current?.contains(event.target as Node))passengerPanel.current?.removeAttribute('open');};document.addEventListener('pointerdown',dismiss);return()=>document.removeEventListener('pointerdown',dismiss);},[]);
 const [dateEdited,setDateEdited]=useState(false);
 const date=dateEdited?selection.date:selection.date||fare?.date||'';
 const quote=availability.quote;
 // Use supplied adult unit prices, never recalculate seasonal/category/capacity rules.
 const quoted=quote?.departures.filter(d=>d.available).flatMap(d=>d.passengerQuote?.lines.filter(l=>l.category==='adult'&&l.quantity>0).map(l=>l.unitPrice)??[])??[];
 const candidate=availability.error||availability.loading?undefined:selection.date?lowestQuotedFare(quoted):date?fare?.amount:undefined;
 const amount=candidate!==undefined&&Number.isSafeInteger(candidate)&&candidate>=0?candidate:undefined;
 const canBook=Boolean(date)&&!availability.loading&&!availability.error&&(!quote||quote.departures.some(d=>d.available));
 const caption=passengerKeys.filter(k=>counts[k]>0).map(k=>passengerCaption(k,counts[k])).join(', ')||'Choose passengers';
 return <div className={`${styles.card}${embedded?` ${styles.productCard}`:""}`} data-floating-obstacle aria-label={product?`${product.title} availability`:"Daily ticket availability"}>{productTitle?<><div className={styles.ticketHeader}><div><p className={styles.ticket}>{embedded?"Van experience":"Daily Ticket"}</p><h2>{productTitle}</h2></div><div className={styles.mobileFare} aria-live="polite" aria-busy={availability.loading}>{amount===undefined?<span>{availability.loading?'Checking price…':'Check availability'}</span>:<><span>From</span><strong>{bookingMoney(amount,quote?.currency??fare?.currency??'EUR',true)}</strong><small>per adult</small></>}</div></div>
  {product&&<p>{reservationLabel(product)}</p>}
  <form onSubmit={event=>{event.preventDefault();if(!canBook)return;setSelection(current=>({...current,date,departureId:current.date===date?current.departureId:''}));open();}}>
   <div className={styles.fields}><BookingDateSelector value={date} onChange={value=>{setDateEdited(true);setSelection(current=>({...current,date:value,departureId:''}));}}/><details ref={passengerPanel} className={styles.passengers} onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.removeAttribute('open');event.currentTarget.querySelector('summary')?.focus();}}}><summary><span>Passengers</span><strong>{caption}</strong><span aria-hidden="true">⌄</span></summary><div><QuantityStepper/></div></details></div>
   <div className={styles.purchase}><div aria-live="polite" aria-busy={availability.loading}><BookingPriceIndicator ticketLabel={embedded?(product?.mode==='whole_day'?'Whole-day reservation':'Selected departure'):undefined} amount={amount} date={date} currency={quote?.currency??fare?.currency}/>{availability.loading&&<small>Checking your date…</small>}</div><Button type="submit" size="lg" className="p-button p-button-booking" aria-haspopup="dialog" disabled={!canBook}>{bookingLabel}</Button></div>
   {availability.error&&<p className={styles.feedback} role="status">{availability.error}</p>}{!date&&<p className={styles.feedback}>Choose a date to check availability.</p>}
  </form></>:<><BookingPriceIndicator/><p>Ticket availability is temporarily unavailable.</p></>}</div>;
}
