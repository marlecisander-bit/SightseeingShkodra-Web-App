'use client';
import {useEffect,useRef,useState} from 'react';
import type {AvailabilityQuote} from '@/modules/booking/contracts';
import styles from './mobile-booking-date.module.css';

function day(date:Date){return date.toISOString().slice(0,10);}
function localToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tirane',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(key=>parts.find(p=>p.type===key)?.value).join('-');}
const format=(value:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('en-GB',{...options,timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
/** Inline calendar; availability is validated before committing a date. */
export function MobileBookingDate({value,onChange,quote,checkDate}:{value:string;onChange:(value:string,checked?:boolean)=>void;quote?:AvailabilityQuote;checkDate:(date:string,signal:AbortSignal)=>Promise<AvailabilityQuote>}){
 const [today]=useState(localToday),[month,setMonth]=useState((value||today).slice(0,7));
 const [checking,setChecking]=useState(''),[error,setError]=useState(''),[unavailable,setUnavailable]=useState<string[]>([]);
 const request=useRef<AbortController|null>(null),minimum=quote?.businessDate||today;
 useEffect(()=>()=>request.current?.abort(),[]);
 useEffect(()=>{const clear=()=>setUnavailable([]),timer=setInterval(clear,30000);window.addEventListener('focus',clear);return()=>{clearInterval(timer);window.removeEventListener('focus',clear);};},[]);
 function moveMonth(amount:number){request.current?.abort();setChecking('');setError('');setUnavailable([]);const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+amount);setMonth(day(date).slice(0,7));}
 async function choose(date:string){
  if(checking===date)return;
  request.current?.abort();const controller=new AbortController();request.current=controller;setChecking(date);setError('');
  try{const next=await checkDate(date,controller.signal);if(controller.signal.aborted)return;
   if(!next.departures.some(d=>d.available)){setUnavailable(old=>old.includes(date)?old:[...old,date]);setError('No departures available. Choose another date.');return;}
   onChange(date,true);
  }catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Availability is temporarily unavailable. Please retry.');}finally{if(!controller.signal.aborted)setChecking('');}
 }
 const count=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate(),blank=(new Date(month+'-01T12:00:00Z').getUTCDay()+6)%7,total=Math.ceil((blank+count)/7)*7;
 return <section className={styles.root} aria-label="Booking calendar">
  <div className={styles.month}><strong aria-live="polite">{format(month+'-01',{month:'long',year:'numeric'})}</strong><div><button type="button" aria-label="Previous month" disabled={month<=minimum.slice(0,7)} onClick={()=>moveMonth(-1)}>‹</button><button type="button" aria-label="Next month" onClick={()=>moveMonth(1)}>›</button></div></div>
  <div className={styles.weekdays} aria-hidden="true">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span key={d}>{d}</span>)}</div>
  <div className={styles.days} role="group" aria-label="Choose booking date">{Array.from({length:total},(_,i)=>{const number=i-blank+1,dateObject=new Date(month+'-01T12:00:00Z');dateObject.setUTCDate(number);const date=day(dateObject),outside=date.slice(0,7)!==month,disabled=outside||date<minimum||unavailable.includes(date)||(quote?.date===date&&!quote.departures.some(d=>d.available));return <button type="button" key={date} disabled={disabled||checking===date} aria-pressed={date===value} aria-busy={checking===date} aria-label={`${disabled?'Unavailable: ':'Check availability: '}${format(date,{day:'numeric',month:'long',year:'numeric'})}`} onClick={()=>void choose(date)}>{dateObject.getUTCDate()}</button>;})}</div>
  {(checking||error)&&<p role="status" aria-live="polite">{checking?'Checking availability…':error}</p>}
 </section>;
}
