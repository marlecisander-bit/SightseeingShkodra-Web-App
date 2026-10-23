'use client';
import {useCallback,useEffect,useState} from 'react';
import {LiveJourneyTracker} from './live-journey-tracker';
import {LiveMapEmbed} from './live-map-embed';
import {plannerClock,plannerSummary,type DayPlannerData} from '@/modules/content/day-planner';
import {sectionVisible,type WebsiteContent} from '@/modules/content/website-schema';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './route-journey.module.css';

type Place={id:string;name:string;text:string;link:string;stopId?:string|null;showOnPage?:boolean;image?:string;alt?:string;tag?:string};
export function RouteJourney({content,initial,places}:{content:WebsiteContent;initial:DayPlannerData;places:Place[]}){
 const [journey,setJourney]=useState<JourneySnapshot|null>(null),[selected,setSelected]=useState('');
 const [stale,setStale]=useState(false);
 const receiveJourney=useCallback((snapshot:JourneySnapshot|null,reason?:'stale'|'loading')=>{setJourney(snapshot);setStale(reason==='stale');},[]);
 const [data,setData]=useState(initial),[now,setNow]=useState<Date|null>(null),[scheduleFailed,setScheduleFailed]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();let pending=false;
  const refresh=async()=>{setNow(new Date());if(pending||document.visibilityState==='hidden')return;pending=true;try{const r=await fetch('/api/public/day-planner',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]),cache:'no-store'});if(!r.ok)throw Error();setData(await r.json());setScheduleFailed(false);}catch{if(!controller.signal.aborted)setScheduleFailed(true);}finally{pending=false;}};
  const clock=setTimeout(()=>setNow(new Date()),0);const timer=setInterval(()=>void refresh(),60000);
  const visible=()=>{if(document.visibilityState==='visible')void refresh();};document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();clearTimeout(clock);clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[]);
 const stops=data.stops??[];
 const summary=now?plannerSummary(data,now):null;
 const scheduleCurrent=now&&plannerClock(now).date===data.date&&!scheduleFailed;
 const selectStop=(id:string)=>{setSelected('');requestAnimationFrame(()=>setSelected(id));document.getElementById('journey-map')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 return <main id="main-content" className={`p-container ${styles.page}`}>
  <header className={styles.intro}><p className="p-eyebrow">{content['routePage.eyebrow']}</p><h1>{content['routePage.title']}</h1><p>{content['routePage.text']}</p><p className={styles.metadata}>{stops.length?`${stops.length} stops · `:''}Hop on &amp; off · Live van tracking</p></header>
  <div id="journey-map" className={styles.map}><LiveMapEmbed priority presentation="full" onJourney={receiveJourney} selectedStopId={selected}/></div>
  {sectionVisible(content,'route')&&<section aria-labelledby="journey-title"><h2 className={content['routePage.stops']===content['routePage.title']?'p-screen-reader-only':undefined} id="journey-title">{content['routePage.stops']}</h2><LiveJourneyTracker stops={stops} places={places.filter(p=>p.showOnPage!==false)} journey={journey} stale={stale} onMap={selectStop} learnLabel={content['labels.destination']} mapLabel={content['routePage.mapAction']}/></section>}
  {sectionVisible(content,'departures')&&<section className={styles.section} aria-labelledby="journey-departures"><p className="p-eyebrow">Today · Local Shkodra time</p><h2 id="journey-departures">{content['routePage.departures']}</h2><p>{scheduleCurrent?summary?.status:'Schedule temporarily unavailable. Check availability when booking.'}</p>{scheduleCurrent&&data.times&&<ul className={styles.times}>{data.times.map(time=><li key={time} data-state={time<=plannerClock(now).time?"past":time===summary?.upcoming?.[0]?"next":"upcoming"}><time>{time}</time><small>{time<=plannerClock(now).time?'Scheduled earlier':time===summary?.upcoming?.[0]?'Next scheduled':'Upcoming'}</small></li>)}</ul>}<p className={styles.note}>Scheduled times are not a seat guarantee. Booking checks current availability and the advance-booking cutoff.</p></section>}
 </main>;
}
