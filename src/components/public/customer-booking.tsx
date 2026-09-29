"use client";
import { BookingSummary, BookingDateSelector, PassengerSelector, DepartureSelector, CancelBookingDialog } from "./booking-controls";
import { PublicBookingLink, useBooking } from "./booking";
import Link from "next/link";
import { meetingPoint } from "@/modules/booking/meeting-point";

import { useEffect, useRef, useState } from 'react';
import type { AvailabilityQuote } from '@/modules/booking/contracts';
import { passengerKeys, passengerCount, type PassengerCounts } from '@/modules/booking/passengers';
import { bookingMoney as displayMoney, bookingCutoff, safeBookingFeedback } from "./booking-presentation";
import styles from './customer-booking.module.css';
type Booking={reference:string;status:string;version:number;date:string;time:string;departureId:string;counts:PassengerCounts;occupiedSeats:number;total:number;currency:string;cutoff:string;canManage:boolean;requiresStaff:boolean};
const messages:Record<string,string>={NOT_FOUND:'This booking link is invalid. Please check your confirmation.',CLOSED:'Online changes for this departure are now closed.',CONTACT_OPERATOR:'Please contact the operator to change this booking.',CHANGED:'The booking or price changed. Reload and review it again.',SOLD_OUT:'There are not enough seats. Your original booking is unchanged.',INVALID_REQUEST:'Please check the date and passengers.',ADULT_REQUIRED:'At least one adult is required for children or infants.',UNAVAILABLE:'Unable to confirm the result. Retry or reload your booking before making another change.'};
export function CustomerBooking(){
 const {reset} = useBooking();
 const cancelledReset=useRef(false);
 const heading=useRef<HTMLHeadingElement>(null);
 const token=useRef('');const request=useRef('');const [booking,setBooking]=useState<Booking>();const [mode,setMode]=useState<'view'|'modify'|'review'|'cancel'>('view');const [date,setDate]=useState('');const [counts,setCounts]=useState<PassengerCounts>({adult:1,child:0,infant:0});const [departure,setDeparture]=useState('');const [quote,setQuote]=useState<AvailabilityQuote>();const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [updated,setUpdated]=useState(false);
 useEffect(()=>{heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});},[mode]);
 useEffect(()=>{if(booking?.status==='cancelled'&&!cancelledReset.current){cancelledReset.current=true;reset();}},[booking?.status,reset]);
 async function call(body:Record<string,unknown>,signal?:AbortSignal){const r=await fetch('/api/public/booking-management',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,token:token.current}),signal:signal??AbortSignal.timeout(20000),cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(messages[data.error]??messages.UNAVAILABLE);return data;}
 async function reload(){setBusy(true);setError('');try{setBooking(await call({action:'read'}));setMode('view');}catch(e){setError(safeBookingFeedback(e,messages));}finally{setBusy(false);}}
 useEffect(()=>{token.current=new URLSearchParams(location.hash.slice(1)).get('token')??'';const timer=setTimeout(()=>void reload(),0);return()=>clearTimeout(timer);/* Initial credential is kept out of request URLs. */ // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{if(mode!=='modify'||!date)return;const controller=new AbortController();const timer=setTimeout(async()=>{setLoading(true);setQuote(undefined);setError('');try{passengerCount(counts);const result=await call({action:'availability',date,counts},controller.signal);if(!controller.signal.aborted)setQuote(result);}catch(e){if(!controller.signal.aborted)setError(safeBookingFeedback(e,messages));}finally{if(!controller.signal.aborted)setLoading(false);}},200);return()=>{clearTimeout(timer);controller.abort();};},[date,counts,mode]);
 // Quotes are only current if both party and date still match the request.
 const current=quote?.date===date&&quote.guests===passengerKeys.reduce((n,k)=>n+counts[k],0)&&(!quote.departures.length || passengerKeys.every(k=>quote.departures[0]?.passengerQuote?.counts[k]===counts[k]))?quote:undefined;
 const selected=current?.departures.find(d=>d.id===departure&&d.available);
 const price=selected?.passengerQuote;
 const committing=useRef(false);
 async function commit(action:'modify'|'cancel'){if(!booking||committing.current)return;committing.current=true;setBusy(true);setError('');try{const result=await call(action==='cancel'?{action}:{action,version:booking.version,departureId:departure,counts,total:price?.total,requestId:request.current});setBooking(result);setUpdated(action==='modify');setMode('view');setQuote(undefined);setDeparture('');setDate('');setCounts({adult:1,child:0,infant:0});request.current='';}catch(e){setError(safeBookingFeedback(e,messages));}finally{committing.current=false;setBusy(false);}}
 function edit(){if(!booking)return;setDate(booking.date);setCounts(booking.counts);setDeparture(booking.departureId);setQuote(undefined);setError('');setUpdated(false);setMode('modify');}
 return <section className={styles.card} aria-busy={busy}>
  <h1 ref={heading} tabIndex={-1}>Manage your booking</h1>
  {error&&<p role="alert">{error}</p>}{updated&&mode==='view'&&<p role="status">Your booking has been updated. Your current details are shown below.</p>}
  {!booking?<><p>{busy?'Loading booking…':'Use the private link in your confirmation.'}</p><button className="p-button" disabled={busy} onClick={()=>void reload()}>Reload booking</button></>:<>
   <p><strong>{booking.reference}</strong> <span className={styles.status} data-status={booking.status}>{booking.status==='confirmed'?'Confirmed':booking.status==='cancelled'?'Booking cancelled':booking.status}</span></p>
   {(mode==='view'||mode==='cancel')&&<><BookingSummary date={booking.date} time={booking.time} counts={booking.counts} total={booking.total} currency={booking.currency}/><p><a href={meetingPoint.url} target="_blank" rel="noreferrer">Open in Maps</a></p>{booking.canManage&&bookingCutoff(booking.cutoff)&&<p>Changes and cancellation available until {bookingCutoff(booking.cutoff)} (local Shkodra time).</p>}</>}
   {mode==='view'&&<>{booking.canManage?<div className={styles.actions}><button className="p-button p-button-booking" onClick={edit}>Modify booking</button><button className="p-button" onClick={()=>setMode('cancel')}>Cancel booking</button></div>:booking.status==='confirmed'?<p>{booking.requiresStaff?'Contact the operator for changes.':'Online modifications for this departure are now closed. Online cancellation for this departure is now closed.'}</p>:<><p>Your booking has been cancelled.</p><div className={styles.actions}><PublicBookingLink className="p-button p-button-booking" href="/book" onClick={reset}>Book another day</PublicBookingLink><Link className="p-button" href="/">Return to homepage</Link></div></>}<button className="p-text-button" disabled={busy} onClick={()=>void reload()}>Reload booking</button></>}
   {mode==='modify'&&<><h2>Change your booking</h2><BookingDateSelector value={date} onChange={value=>{setDate(value);setDeparture('');}}/><PassengerSelector counts={counts} categories={current?.categories} onChange={(key,value)=>setCounts({...counts,[key]:value})} canRemove={key=>!(counts[key]===0||(key==='adult'&&counts.adult===1))} canAdd={key=>counts[key]<99}/><p role="status">{loading?'Checking availability…':'Choose a departure. Infants do not occupy seats.'}</p><DepartureSelector departures={current?.departures??[]} value={departure} loading={loading} onChange={setDeparture}/>{current?.departures.length===0&&<p>No bookable departures on this date.</p>}<div className={styles.actions}><button className="p-button" onClick={()=>setMode('view')}>Back</button><button className="p-button p-button-booking" disabled={!price||loading} onClick={()=>{request.current=crypto.randomUUID();setMode('review');}}>Review changes</button></div></>}
   {mode==='review'&&price&&<><h2>Review changes</h2><BookingSummary date={date} time={selected?.startTime} counts={counts} total={price.total} currency={booking.currency}/><p>Current: {displayMoney(booking.total,booking.currency)}<br/>Updated: {displayMoney(price.total,booking.currency)}<br/>Difference: {displayMoney(price.total-booking.total,booking.currency)}</p><p>Updated total is payable at the meeting point.</p><div className={styles.actions}><button className="p-button" disabled={busy} onClick={()=>setMode('modify')}>Back</button><button className="p-button p-button-booking" disabled={busy} onClick={()=>void commit('modify')}>{busy?'Saving…':'Confirm modification'}</button></div></>}
   {mode==='cancel'&&<CancelBookingDialog reference={booking.reference} date={booking.date} time={booking.time} busy={busy} error={error} onKeep={()=>setMode('view')} onConfirm={()=>void commit('cancel')}/>}

  </>}
 </section>;
}
