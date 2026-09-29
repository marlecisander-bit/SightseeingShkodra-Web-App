"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { AvailabilityQuote } from "@/modules/booking/contracts";
import { ageLabel, passengerKeys, passengerLabels, type PassengerCategories, type PassengerCounts } from "@/modules/booking/passengers";
import { bookingMoney as displayMoney, passengerCaption, bookingDate, availabilityLabel } from "./booking-presentation";
import type { PassengerSnapshot } from "@/modules/booking/passengers";
import styles from "./booking-controls.module.css";

export function BookingProgress({step,complete=false}:{step:number;complete?:boolean}) {
  return <ol className="p-progress" aria-label="Booking progress">{["When","Details","Confirm"].map((label,index)=>{
    const done=complete||index+1<step;
    return <li key={label} data-complete={done} aria-current={!complete&&index+1===step?"step":undefined}><span aria-hidden="true">{done?"\u2713":index+1}</span>{label}<small className="p-screen-reader-only">{done?" completed":index+1===step?" current step":" upcoming"}</small></li>;
  })}</ol>;
}

export function BookingPriceIndicator({amount,date,total=false,currency="EUR"}:{amount?:number;date?:string;total?:boolean;currency?:string}) {
  amount=amount!==undefined&&Number.isFinite(amount)&&amount>0?amount:undefined;
  return <p className="p-booking-price"><strong>{amount===undefined?"Check availability":`${total?"Total":"From"} ${displayMoney(amount,currency,!total)}`}</strong>{amount!==undefined&&!total&&<small>Per adult · Daily ticket{date?` · ${bookingDate(date)}`:""}</small>}</p>;
}

export function BookingDateSelector({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  const update=(next:string)=>{if(next!==value)onChange(next);};
  return <label className={styles.date}><span>Select date</span><input aria-label="Your date" type="date" value={value} onChange={event=>update(event.target.value)} onInput={event=>update(event.currentTarget.value)} onBlur={event=>update(event.currentTarget.value)} /></label>;
}

/** Controlled presentation only; callers retain their existing selection and limits. */
export function PassengerSelector({counts,categories,onChange,canRemove,canAdd}:{counts:PassengerCounts;categories?:PassengerCategories;onChange:(key:keyof PassengerCounts,value:number)=>void;canRemove:(key:keyof PassengerCounts)=>boolean;canAdd:(key:keyof PassengerCounts)=>boolean}) {
  return <fieldset className={styles.passengers}><legend>Who&apos;s coming?</legend>{passengerKeys.map(key=><div className={styles.passenger} key={key}><span>{passengerLabels[key]}<small>{categories?ageLabel(categories[key]):""}{key==="infant"?`${categories?" · ":""}No seat required`:""}</small></span><div className={styles.counter} role="group" aria-label={passengerLabels[key]}><button type="button" disabled={!canRemove(key)} aria-label={`Remove one ${key}`} onClick={()=>onChange(key,counts[key]-1)}>−</button><output aria-live="polite">{counts[key]}</output><button type="button" disabled={!canAdd(key)} aria-label={`Add one ${key}`} onClick={()=>onChange(key,counts[key]+1)}>+</button></div></div>)}</fieldset>;
}

export function DepartureSelector({departures,value,onChange,loading=false}:{departures:AvailabilityQuote["departures"];value:string;onChange:(value:string)=>void;loading?:boolean}) {
  return <fieldset className={styles.departures} aria-busy={loading}><legend>Choose departure</legend><div className={styles.grid}>{departures.map(departure=><button type="button" key={departure.id} disabled={loading||!departure.available} aria-pressed={value===departure.id&&departure.available} onClick={()=>onChange(departure.id)}><strong>{departure.startTime.slice(0,5)}{value===departure.id&&departure.available&&<span aria-hidden="true"> ✓</span>}</strong><span>{availabilityLabel(departure)}</span></button>)}</div></fieldset>;
}

export function BookingSummary({date,time,counts,total,currency="EUR"}:{date:string;time?:string;counts:PassengerCounts;total?:number;currency?:string}) {
  return <aside className={styles.summary} aria-label="Your booking"><h3>Your booking</h3><dl><div><dt>Date</dt><dd>{bookingDate(date)}</dd></div><div><dt>Departure</dt><dd>{time?.slice(0,5)||"Choose a departure"}</dd></div><div><dt>Passengers</dt><dd>{passengerKeys.filter(key=>counts[key]>0).map(key=><span key={key}>{passengerCaption(key,counts[key])}{key==="infant"?" · No seat required":""}</span>)}</dd></div><div><dt>Total</dt><dd>{total===undefined?"Choose your departure":displayMoney(total,currency)}</dd></div></dl><p>Times shown in local Shkodra time.</p></aside>;
}

export function CancelBookingDialog({date,time,reference,busy,error,onKeep,onConfirm}:{date:string;time:string;reference:string;busy:boolean;error:string;onKeep:()=>void;onConfirm:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const keep=useRef<HTMLButtonElement>(null);
  useEffect(()=>{const node=dialog.current;node?.showModal();keep.current?.focus();return()=>node?.close();},[]);
  return <dialog ref={dialog} className={styles.cancel} aria-labelledby="cancel-booking-title" onCancel={event=>{event.preventDefault();if(!busy)onKeep();}}><h2 id="cancel-booking-title">Cancel this booking?</h2><p><strong>{reference}</strong></p><p>{bookingDate(date)} · {time.slice(0,5)}</p><p>This booking will be cancelled and your seats released. This cannot be undone.</p>{error&&<p role="alert">{error}</p>}<div><button ref={keep} type="button" className="p-button p-button-booking" disabled={busy} onClick={onKeep}>Keep booking</button><button type="button" className="p-button" disabled={busy} onClick={onConfirm}>{busy?"Cancelling…":"Confirm cancellation"}</button></div></dialog>;
}

export function BookingPriceBreakdown({snapshot}:{snapshot:PassengerSnapshot}) {
  return <dl className={styles.breakdown} aria-label="Ticket prices">{snapshot.lines.filter(line=>line.quantity>0).map(line=><div key={line.category}><dt>{passengerCaption(line.category,line.quantity)}{line.offer?.label&&<small>{line.offer.label}</small>}</dt><dd>{line.category==="infant"&&line.total===0?"Free":displayMoney(line.total,snapshot.currency)}</dd></div>)}<div><dt>Total</dt><dd>{displayMoney(snapshot.total,snapshot.currency)}</dd></div></dl>;
}

export function BookingAction({total,currency,children}:{total?:number;currency:string;children:ReactNode}) {
 return <div className="p-booking-action"><div className="p-action-total" aria-live="polite">{total===undefined?<span>Choose a departure</span>:<><span>Total</span><strong>{displayMoney(total,currency)}</strong></>}</div>{children}</div>;
}
