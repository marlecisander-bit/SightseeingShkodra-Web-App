'use client';
import {useCallback,useEffect,useState} from 'react';
import {SightseeingStopsExperience} from './sightseeing-stops-experience';
import {LiveMapEmbed} from './live-map-embed';
import {BookButton} from './booking';
import {BookingPriceIndicator} from './booking-controls';
import {ExpandableText} from './expandable-text';
import type {Homepage} from '@/modules/content/homepage';
import {plannerClock,plannerSummary,type DayPlannerData} from '@/modules/content/day-planner';
import {sectionVisible,type WebsiteContent} from '@/modules/content/website-schema';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './route-journey.module.css';

type Place={id:string;name:string;text:string;link:string;stopId?:string|null;showOnPage?:boolean;image?:string;alt?:string;tag?:string};
export function RouteJourney({content,initial,places,product,fare}:{content:WebsiteContent;initial:DayPlannerData;places:Place[];product?:Homepage["product"];fare?:Homepage["heroFare"]}){
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
  {sectionVisible(content,'route')&&<section aria-labelledby="journey-title"><h2 className={content['routePage.stops']===content['routePage.title']?'p-screen-reader-only':undefined} id="journey-title">{content['routePage.stops']}</h2><SightseeingStopsExperience mode="live" stops={stops} places={places.filter(p=>p.showOnPage!==false)} journey={journey} stale={stale} onMap={selectStop} learnLabel={content['labels.destination']} mapLabel={content['routePage.mapAction']}/></section>}
  <div id="journey-map" className={styles.map}><LiveMapEmbed priority presentation="full" onJourney={receiveJourney} selectedStopId={selected}/></div>
  {sectionVisible(content,'departures')&&<section className={styles.section} aria-labelledby="journey-departures"><p className="p-eyebrow">Today · Local Shkodra time</p><h2 id="journey-departures">{content['routePage.departures']}</h2><p>{scheduleCurrent?summary?.status:'Schedule temporarily unavailable. Check availability when booking.'}</p>{scheduleCurrent&&data.times&&<ul className={styles.times}>{data.times.map(time=><li key={time} data-state={time<=plannerClock(now).time?"past":time===summary?.upcoming?.[0]?"next":"upcoming"}><time>{time}</time><small>{time<=plannerClock(now).time?'Scheduled earlier':time===summary?.upcoming?.[0]?'Next scheduled':'Upcoming'}</small></li>)}</ul>}<p className={styles.note}>Scheduled times are not a seat guarantee. Booking checks current availability and the advance-booking cutoff.</p></section>}
  {product&&<section className="p-daily-ticket p-route-ticket" aria-labelledby="journey-ticket"><div><p className="p-eyebrow">{content['intro.eyebrow']}</p><h2 id="journey-ticket">{content['intro.title']}</h2><h3>{product.title}</h3>{product.inclusions&&<ExpandableText text={product.inclusions}/>}<div className="p-ticket-support"><p>{stops.length?`${stops.length} stops · `:''}Live van tracking</p>{sectionVisible(content,'departures')&&<p>Departures today: {scheduleCurrent?(data.times?.length?data.times.join(' · '):summary?.status):'Schedule temporarily unavailable'}</p>}</div></div><div className="p-ticket-action"><BookingPriceIndicator amount={fare?.amount} date={fare?.date} currency={fare?.currency}/><BookButton>{content['nav.book']}</BookButton><p className={styles.note}>Reserve online. Pay at the meeting point.</p></div></section>}
  {!product&&<div className={styles.booking}><BookButton>{content['nav.book']}</BookButton><span>Check ticket details and availability.</span></div>}
 </main>;
}
