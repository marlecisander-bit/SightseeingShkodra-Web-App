'use client';
import {useEffect,useId,useRef,useState} from 'react';
import type {AvailabilityQuote} from '@/modules/booking/contracts';
import styles from './mobile-booking-date.module.css';

function day(date:Date){return date.toISOString().slice(0,10);}
function offset(value:string,amount:number){const date=new Date(value+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+amount);return day(date);}
function localToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tirane',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(key=>parts.find(p=>p.type===key)?.value).join('-');}
const format=(value:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('en-GB',{...options,timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
export function MobileBookingDate({value,onChange,quote,checkDate}:{value:string;onChange:(value:string,checked?:boolean)=>void;quote?:AvailabilityQuote;checkDate:(date:string,signal:AbortSignal)=>Promise<AvailabilityQuote>}){
 const [today]=useState(localToday),[open,setOpen]=useState(false),[month,setMonth]=useState((value||today).slice(0,7));
 const [checking,setChecking]=useState(''),[error,setError]=useState(''),[unavailable,setUnavailable]=useState<string[]>([]);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),request=useRef<AbortController|null>(null),historyOwned=useRef(false),title=useId();
 const minimum=quote?.businessDate||today,start=value&&value>=minimum?value:minimum;
 const close=()=>dialog.current?.close();
 const releaseHistory=()=>{if(!historyOwned.current)return;historyOwned.current=false;if(window.history.state?.ssBookingCalendar===title)window.history.back();};
 useEffect(()=>()=>{request.current?.abort();if(historyOwned.current){historyOwned.current=false;if(window.history.state?.ssBookingCalendar===title)window.history.back();}},[title]);
 useEffect(()=>{
  if(!open)return;const node=dialog.current;node?.showModal();node?.querySelector<HTMLButtonElement>('[aria-current="date"]')?.focus();
  const marker='ssBookingCalendar';window.history.pushState({...window.history.state,[marker]:title},'');historyOwned.current=true;
  const back=()=>{if(window.history.state?.[marker]!==title){historyOwned.current=false;node?.close();}};window.addEventListener('popstate',back);
  return()=>window.removeEventListener('popstate',back);
 },[open,title]);
 function moveMonth(amount:number){request.current?.abort();setChecking('');setError('');const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+amount);setMonth(day(date).slice(0,7));}
 async function choose(date:string){
  if(checking===date)return;
  request.current?.abort();const controller=new AbortController();request.current=controller;setChecking(date);setError('');
  try{const next=await checkDate(date,controller.signal);if(controller.signal.aborted)return;
   if(!next.departures.some(d=>d.available)){setUnavailable(old=>old.includes(date)?old:[...old,date]);setError('No bookable departure on this date. Choose another date.');return;}
   onChange(date,true);close();
  }catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Availability is temporarily unavailable. Please retry.');}finally{if(!controller.signal.aborted)setChecking('');}
 }
 const count=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate(),blank=(new Date(month+'-01T12:00:00Z').getUTCDay()+6)%7;
 return <div className={styles.root}>
  <div className={styles.label}><span>Date</span><button ref={trigger} type="button" aria-haspopup="dialog" onClick={()=>{setMonth((value||minimum).slice(0,7));setUnavailable([]);setError('');setOpen(true);}}>Calendar <span aria-hidden="true">▦</span></button></div>
  <div className={styles.strip} role="group" aria-label="Choose booking date">{Array.from({length:7},(_,i)=>offset(start,i)).map(date=><button key={date} type="button" aria-pressed={value===date} aria-label={format(date,{weekday:'long',day:'numeric',month:'long'})} onClick={()=>onChange(date)}><span>{format(date,{weekday:'short'})}</span><strong>{format(date,{day:'numeric'})}</strong><span>{format(date,{month:'short'})}</span></button>)}</div>
  <dialog ref={dialog} className={styles.calendar} aria-labelledby={title} onCancel={event=>{event.preventDefault();event.stopPropagation();close();}} onClose={event=>{event.stopPropagation();request.current?.abort();setChecking('');setOpen(false);releaseHistory();trigger.current?.focus({preventScroll:true});}} onKeyDown={event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const controls=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}>
   <header><h3 id={title}>Choose a date</h3><button type="button" aria-label="Close calendar" onClick={close}>×</button></header>
   <div className={styles.calendarContent}>
    <div className={styles.month}><button type="button" aria-label="Previous month" disabled={month<=minimum.slice(0,7)} onClick={()=>moveMonth(-1)}>‹</button><strong>{format(month+'-01',{month:'long',year:'numeric'})}</strong><button type="button" aria-label="Next month" onClick={()=>moveMonth(1)}>›</button></div>
    <div className={styles.days}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span key={d} aria-hidden="true">{d}</span>)}{Array.from({length:blank},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:count},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0'),disabled=date<minimum||unavailable.includes(date);return <button type="button" key={date} disabled={disabled||checking===date} aria-current={date===value?'date':undefined} aria-busy={checking===date} aria-label={`${disabled?'Unavailable: ':'Check availability: '}${format(date,{day:'numeric',month:'long',year:'numeric'})}`} onClick={()=>void choose(date)}>{i+1}</button>;})}</div>
    <p role="status" aria-live="polite">{checking?'Checking availability…':error||'Tap a date to check real availability. Only a bookable date will be selected.'}</p>
   </div>
  </dialog>
 </div>;
}
