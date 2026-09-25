'use client';
import {useMapStatus} from './use-map-status';
import Link from 'next/link';
import { useEffect, useState, useRef, useId, type ReactNode } from 'react';
import { plannerClock, plannerSummary, type DayPlannerData } from '@/modules/content/day-planner';

export function DayPlannerStrip({initial}:{initial?:DayPlannerData}) {
 const [data,setData]=useState<DayPlannerData|null>(initial??null),[failed,setFailed]=useState(false),[now,setNow]=useState(()=>new Date());
 const liveStatus=useMapStatus();
 const day=plannerClock(now).date;
 useEffect(()=>{const id=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(id);},[]);
 useEffect(()=>{if(initial?.date===day)return;const controller=new AbortController();fetch('/api/public/day-planner',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{setData(value);setFailed(false);}).catch(()=>{if(!controller.signal.aborted)setFailed(true);});return()=>controller.abort();},[day,initial]);
 const summary=data?plannerSummary(data,now):null;
 return <div className="p-facts p-day-planner" aria-label="Plan your day">
  <Link href="/book"><span>01 / HOP ON</span><strong>{summary?.price!=null?`From ${new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(summary.price/100)} per adult`:data||failed?'View tickets':'Loading fare…'}</strong><small>{data?.title??'Daily ticket'}</small></Link>
  <PlannerPanel title="Route & stops" label={<><span>02 / EXPLORE</span><strong>{data?.stops?`${data.stops.length} stops around Shkodra`:data||failed?'Explore route':'Loading route…'}</strong><small>View route &amp; stops</small></>}><ol>{data?.stops?.map(s=><li key={s.id}>{s.label}</li>)}</ol><Link href="/live">Open live map</Link></PlannerPanel>
  <PlannerPanel title="Today’s departures" label={<><span>03 / HOP BACK ON</span><strong>{summary?.status??(failed?'View today’s schedule':'Checking today’s service…')}</strong><small>{summary?.upcoming?.join(' · ')}</small><small>Local time · Europe/Tirane</small></>}>{data?.times?.length?<ul>{data.times.map(t=><li key={t}>{t} — {t<=plannerClock(now).time?'Departed':t===summary?.upcoming?.[0]?'Next':'Upcoming'}</li>)}</ul>:<p>{summary?.status??'Schedule unavailable'}</p>}<Link href="/book">Check availability</Link></PlannerPanel>
  <Link href="/live"><span>ALWAYS CLOSE BY</span><strong>{liveStatus??'View live van status'}</strong><small>Open live map for the current van status</small></Link>
 </div>;
}

function PlannerPanel({title,label,children}:{title:string;label:ReactNode;children:ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null),id=useId();const [open,setOpen]=useState(false);
 return <div><button className="p-planner-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>{dialog.current?.showModal();setOpen(true);}}>{label}</button><dialog className="p-planner-dialog" id={id} ref={dialog} aria-label={title} onClose={()=>setOpen(false)}><h2>{title}</h2>{children}<form method="dialog"><button className="ss-button" autoFocus>Close</button></form></dialog></div>;
}
