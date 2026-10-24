'use client';
import {useState,useSyncExternalStore,type ReactNode} from 'react';
import Link from 'next/link';
import Form from 'next/form';
import {AdminIcon} from './admin-icon';
import {bookingMatches,bookingStatuses,type BookingListStatus} from './bookings-presentation';
import {ownerStatus} from './presentation';
import styles from './bookings.module.css';
const subscribe=()=>()=>{};
const clientReady=()=>true,serverReady=()=>false;
export type BookingEntry={id:string;status:string;searchText:string;content:ReactNode};
export function BookingsWorkspace({operatorId,today,day,email,selectedBooking,entries,creation,canCreate,result,limited}:{operatorId:string;today:string;day?:string;email?:string;selectedBooking?:string;entries:BookingEntry[];creation?:ReactNode;canCreate:boolean;result?:string;limited:boolean}){
 const ready=useSyncExternalStore(subscribe,clientReady,serverReady);
 const [search,setSearch]=useState(''),[status,setStatus]=useState<BookingListStatus>('all');
 const root=`/admin/${encodeURIComponent(operatorId)}`,base=`${root}/bookings`;
 const visible=selectedBooking?entries:entries.filter(row=>bookingMatches(row,search,status));
 return <div className={styles.workspace} data-bookings-workspace>
  <header className={styles.header}><div><p className={styles.eyebrow}>Reservation management</p><h1>Bookings</h1><p>{selectedBooking?'Reservation details':day?`Departures on ${day}`:'Latest reservations'}</p></div>
   {canCreate&&!selectedBooking&&<Link prefetch={false} className={styles.primary} href={`${base}?${new URLSearchParams({...(day?{date:day}:{}),create:'1'})}#new-booking`}><AdminIcon name="ticket" size={18}/>Create booking</Link>}
  </header>
  {result&&<p role="status" className={styles.notice}>{result}</p>}
  {selectedBooking&&<Link prefetch={false} className={styles.back} href={day?`${base}?date=${day}`:base}>← Back to bookings</Link>}
  {!selectedBooking&&<div className={styles.controls}>
   <label className={styles.search}><AdminIcon name="users" size={18}/><span className={styles.sr}>Search loaded bookings</span><input type="search" disabled={!ready} placeholder="Search loaded bookings" value={search} onChange={e=>setSearch(e.target.value)} aria-describedby="booking-search-scope"/></label>
   <nav className={styles.filters} aria-label="Booking date filters"><Link prefetch={false} aria-current={day===today?'page':undefined} href={`${base}?date=${today}`}>Today</Link><Link prefetch={false} aria-current={!day&&!selectedBooking&&!email?'page':undefined} href={base}>All bookings</Link><Link prefetch={false} href={`${root}/departures?fromBookings=1${day?'&date='+day:''}`}>Calendar</Link></nav>
   <label className={styles.statusFilter}>Reservation status <select disabled={!ready} value={status} onChange={e=>setStatus(e.target.value as BookingListStatus)}>{bookingStatuses.map(value=><option key={value} value={value}>{value==='all'?'All loaded statuses':ownerStatus(value)}</option>)}</select></label>
   <details className={styles.lookup}><summary>Date &amp; email lookup</summary><Form action={base} prefetch={false}><label>Departure date<input type="date" name="date" defaultValue={day}/></label><label>Customer email (exact match)<input name="email" type="email" defaultValue={email} maxLength={254}/></label><button type="submit">Find bookings</button><Link prefetch={false} href={base}>Clear lookup</Link></Form></details>
  </div>}
  {!selectedBooking&&<p id="booking-search-scope" className={styles.scope}>Search name, reference, email or phone within loaded results only. Status also filters loaded results. {limited?'The list is limited to the latest 100 matches.':'This view loads up to 100 recent matches.'} All bookings clears lookup filters; it does not load the full history.</p>}
  {email&&<p className={styles.scope}>Exact-email lookup: {email}</p>}
  {creation}
  {!selectedBooking&&<div className={styles.tableHeader} aria-hidden="true"><span>Guest &amp; reference</span><span>Departure &amp; guests</span><span>Reservation / payment</span><span>Value</span></div>}
  <div className={styles.list} aria-label="Booking results">
   {visible.map(row=><div key={row.id}>{row.content}</div>)}
  </div>
  {!visible.length&&<section className={styles.empty}><AdminIcon name="ticket"/><h2>{entries.length?'No loaded bookings match':'No bookings found'}</h2><p>{entries.length?'Try a different search or status.':'Try a different departure date or exact email lookup.'}</p>{(search||status!=='all')&&<button type="button" onClick={()=>{setSearch('');setStatus('all');}}>Reset loaded filters</button>}</section>}
  <p className={styles.scope}>Only full meeting-point payment collection is supported here. Paid cancellations request refund review; no refund is issued. Amendments use the existing customer workflow and are not added to this staff interface.</p>
 </div>;
}
