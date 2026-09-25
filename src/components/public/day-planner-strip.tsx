'use client';
import {useMapStatus} from './use-map-status';
import Link from 'next/link';
import { useEffect, useState, useRef, useId, type ReactNode } from 'react';
import { plannerClock, plannerSummary, type DayPlannerData } from '@/modules/content/day-planner';

export function DayPlannerStrip({initial, compact=false}:{initial?:DayPlannerData;compact?:boolean}) {
 const [data,setData]=useState<DayPlannerData|null>(initial??null),[failed,setFailed]=useState(false),[now,setNow]=useState(()=>new Date());
 const liveStatus=useMapStatus(!compact);
 const day=plannerClock(now).date;
 useEffect(()=>{const id=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(id);},[]);
 useEffect(()=>{
  const controller=new AbortController();let pending=false;
  async function refresh(){if(pending||document.visibilityState==='hidden')return;pending=true;try{const r=await fetch('/api/public/day-planner',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});if(!r.ok)throw Error();const value=await r.json();if(!controller.signal.aborted){setData(value);setFailed(false);}}catch{if(!controller.signal.aborted){setData(null);setFailed(true);}}finally{pending=false;}}
  if(initial?.date!==day)void refresh();
  const timer=setInterval(()=>void refresh(),60000);
  const visible=()=>{if(document.visibilityState==='visible')void refresh();};
  document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[day,initial]);
 const summary=data?plannerSummary(data,now):null;
 return <div className={`p-facts p-day-planner${compact?" p-day-planner-compact":""}`} aria-label="Plan your day">
  <Link href="/book"><span>01 / HOP ON</span><strong>{summary?.price!=null?`From ${new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(summary.price/100)} per adult`:data||failed?'View tickets':'Loading fare…'}</strong><small>{data?.title??'Daily ticket'}</small></Link>
  {!compact&&<PlannerPanel title="Route & stops" label={<><span>02 / EXPLORE</span><strong>{data?.stops?`${data.stops.length} stops around Shkodra`:data||failed?'Explore route':'Loading route…'}</strong><small>View route &amp; stops</small></>}><ol>{data?.stops?.map(s=><li key={s.id}>{s.label}</li>)}</ol><Link href="/live">Open live map</Link></PlannerPanel>}
  <PlannerPanel title="Today’s departures" label={<><span>03 / HOP BACK ON</span><strong>{summary?.status??(failed?'Schedule temporarily unavailable':'Checking today’s service…')}</strong><small>{summary?.upcoming?.join(' · ')}</small><small>Local time · Europe/Tirane</small></>}>{data?.times?.length?<ul>{data.times.map(t=><li key={t}>{t} — {t<=plannerClock(now).time?'Scheduled earlier':t===summary?.upcoming?.[0]?'Next':'Upcoming'}</li>)}</ul>:<p>{summary?.status??'Schedule unavailable'}</p>}<Link href="/book">Check availability</Link></PlannerPanel>
  {!compact&&<Link href="/live"><span>ALWAYS CLOSE BY</span><strong>{liveStatus??'View live van status'}</strong><small>Open live map for the current van status</small></Link>}
 </div>;
}

function PlannerPanel({title,label,children}:{title:string;label:ReactNode;children:ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null),id=useId();const [open,setOpen]=useState(false);
 return <div><button className="p-planner-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>{dialog.current?.showModal();setOpen(true);}}>{label}</button><dialog className="p-planner-dialog" id={id} ref={dialog} aria-label={title} onClose={()=>setOpen(false)}><h2>{title}</h2>{children}<form method="dialog"><button className="ss-button" autoFocus>Close</button></form></dialog></div>;
}
