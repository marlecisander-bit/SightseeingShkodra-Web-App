'use client';
import {useContext,useEffect,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {NotificationContext} from './notifications';
import {dashboardIsStale,type DailyBookings} from '@/modules/dashboard/daily-bookings';
import styles from './dashboard.module.css';
export function DashboardFreshness({snapshot}:{snapshot:DailyBookings}){
 const router=useRouter(),inbox=useContext(NotificationContext);
 const [clock,setClock]=useState(snapshot.checkedAt),[pending,startTransition]=useTransition();
 useEffect(()=>{const timer=setInterval(()=>setClock(new Date().toISOString()),30_000);return()=>clearInterval(timer);},[]);
 const stale=dashboardIsStale(snapshot.checkedAt,snapshot.timeZone,snapshot.serviceDate,new Date(Math.max(Date.parse(clock),Date.parse(snapshot.checkedAt))));
 return <div className={styles.freshness}>
  <span role="status">{pending?'Refreshing…':snapshot.state==='unavailable'?'Daily totals unavailable.':stale?'Snapshot may be stale. Refresh for current totals.':`Snapshot · ${new Intl.DateTimeFormat('en-GB',{timeZone:snapshot.timeZone,hour:'2-digit',minute:'2-digit'}).format(new Date(snapshot.checkedAt))}`}</span>
  <button type="button" disabled={pending} onClick={()=>startTransition(async()=>{router.refresh();await inbox?.refresh();})}>Refresh dashboard</button>
 </div>;
}
