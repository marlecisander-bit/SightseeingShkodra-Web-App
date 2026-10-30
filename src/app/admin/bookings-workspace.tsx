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
export function BookingsWorkspace({operatorId,today,day,email,selectedBooking,entries,creation,canCreate,result,limited,serverSearch}:{operatorId:string;today:string;day?:string;email?:string;selectedBooking?:string;entries:BookingEntry[];creation?:ReactNode;canCreate:boolean;result?:string;limited:boolean;serverSearch?:{query:string;status:string;page:number;total:number;pageSize:number}}){
 const ready=useSyncExternalStore(subscribe,clientReady,serverReady);
 const [search,setSearch]=useState(serverSearch?.query??''),[status,setStatus]=useState<BookingListStatus>((serverSearch?.status as BookingListStatus)??'all');
 const root=`/admin/${encodeURIComponent(operatorId)}`,base=`${root}/bookings`;
 const visible=selectedBooking||serverSearch?entries:entries.filter(row=>bookingMatches(row,search,status));
 const pagination=(label:string)=>!selectedBooking&&serverSearch?<nav className={styles.filters} aria-label={label}>{[-1,1].map(delta=>{const target=serverSearch.page+delta;if(target<1||delta===1&&target>Math.ceil(serverSearch.total/serverSearch.pageSize))return null;const params=new URLSearchParams({page:String(target),q:serverSearch.query,status:serverSearch.status,...(day?{date:day}:{}),...(email?{email}:{} )});return <Link key={delta} prefetch={false} href={`${base}?${params}`}>{delta<0?'← Previous':'Next →'}</Link>;})}</nav>:null;
 return <div className={styles.workspace} data-bookings-workspace>
  <header className={styles.header}><div><p className={styles.eyebrow}>Reservation management</p><h1>Bookings</h1><p>{selectedBooking?'Reservation details':day?`Departures on ${day}`:serverSearch?'All reservations':'Latest reservations'}</p></div>
   {canCreate&&!selectedBooking&&<Link prefetch={false} className={styles.primary} href={`${base}?${new URLSearchParams({...(day?{date:day}:{}),create:'1'})}#new-booking`}><AdminIcon name="ticket" size={18}/>Create booking</Link>}
  </header>
  {result&&<p role="status" className={styles.notice}>{result}</p>}
  {selectedBooking&&<Link prefetch={false} className={styles.back} href={day?`${base}?date=${day}`:base}>← Back to bookings</Link>}
  {!selectedBooking&&serverSearch?<Form action={base} prefetch={false} className={styles.controls} key={[serverSearch.query,serverSearch.status,day,email].join(':')}>
   <label className={styles.search}><span>Search all bookings</span><input name="q" type="search" maxLength={200} defaultValue={serverSearch.query} placeholder="Name, reference, email or phone"/></label>
   <label>Departure date<input type="date" name="date" defaultValue={day}/></label>
   {email&&<input type="hidden" name="email" value={email}/>}
   <label>Status<select name="status" defaultValue={serverSearch.status}>{bookingStatuses.map(value=><option key={value} value={value}>{value==='all'?'All statuses':ownerStatus(value)}</option>)}</select></label>
   <div className={styles.filterActions}><button type="submit">Find bookings</button><Link prefetch={false} href={base}>Clear filters</Link><Link prefetch={false} href={`${base}?date=${today}`}>Today</Link></div>
  </Form>:!selectedBooking&&<div className={styles.controls}>
   <label className={styles.search}><AdminIcon name="users" size={18}/><span className={styles.sr}>Search these results</span><input type="search" disabled={!ready} placeholder="Search these results" value={search} onChange={e=>setSearch(e.target.value)} aria-describedby="booking-search-scope"/></label>
   <nav className={styles.filters} aria-label="Booking date filters"><Link prefetch={false} aria-current={day===today?'page':undefined} href={`${base}?date=${today}`}>Today</Link><Link prefetch={false} aria-current={!day&&!selectedBooking&&!email?'page':undefined} href={base}>All bookings</Link><Link prefetch={false} href={`${root}/departures?fromBookings=1${day?'&date='+day:''}`}>Calendar</Link></nav>
   <label className={styles.statusFilter}>Reservation status <select disabled={!ready} value={status} onChange={e=>setStatus(e.target.value as BookingListStatus)}>{bookingStatuses.map(value=><option key={value} value={value}>{value==='all'?'All statuses':ownerStatus(value)}</option>)}</select></label>
   <details className={styles.lookup}><summary>Date &amp; email lookup</summary><Form action={base} prefetch={false}><label>Departure date<input type="date" name="date" defaultValue={day}/></label><label>Customer email (exact match)<input name="email" type="email" defaultValue={email} maxLength={254}/></label><button type="submit">Find bookings</button><Link prefetch={false} href={base}>Clear lookup</Link></Form></details>
  </div>}
  {!selectedBooking&&serverSearch&&<p role="status">{serverSearch.total} matching {serverSearch.total===1?'booking':'bookings'} · Page {serverSearch.page} of {Math.max(1,Math.ceil(serverSearch.total/serverSearch.pageSize))}</p>}
  {!selectedBooking&&!serverSearch&&<p id="booking-search-scope" className={styles.scope}>Search and status filter loaded results only. {limited?'Showing the latest 100 matches.':'Showing up to 100 recent matches.'} Use date &amp; email lookup for other bookings.</p>}
  {pagination("Booking result pages")}
  {email&&<p className={styles.scope}>Exact-email lookup: {email}</p>}
  {creation}
  {!selectedBooking&&<div className={styles.tableHeader} aria-hidden="true"><span>Guest &amp; reference</span><span>Departure &amp; guests</span><span>Reservation / payment</span><span>Value</span></div>}
  <div className={styles.list} aria-label="Booking results">
   {visible.map(row=><div key={row.id}>{row.content}</div>)}
  </div>
  {pagination("Booking result pages, bottom")}
  {!visible.length&&<section className={styles.empty}><AdminIcon name="ticket"/><h2>{serverSearch?'No bookings on this page':entries.length?'No loaded bookings match':'No bookings found'}</h2><p>{serverSearch?'Try a different search or clear the filters.':entries.length?'Try a different search or status.':'Try a different departure date or exact email lookup.'}</p>{!serverSearch&&(search||status!=='all')&&<button type="button" onClick={()=>{setSearch('');setStatus('all');}}>Reset loaded filters</button>}</section>}
  <p className={styles.scope}>Only full meeting-point payment collection is supported here. Paid cancellations request refund review; no refund is issued. Amendments use the existing customer workflow and are not added to this staff interface.</p>
 </div>;
}
