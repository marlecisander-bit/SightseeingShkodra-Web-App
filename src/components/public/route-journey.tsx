'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {LiveMapEmbed} from './live-map-embed';
import {BookButton} from './booking';
import {ActionLink} from './ui';
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
 const [data,setData]=useState(initial),[now,setNow]=useState<Date|null>(null),[scheduleFailed,setScheduleFailed]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();let pending=false;
  const refresh=async()=>{setNow(new Date());if(pending||document.visibilityState==='hidden')return;pending=true;try{const r=await fetch('/api/public/day-planner',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]),cache:'no-store'});if(!r.ok)throw Error();setData(await r.json());setScheduleFailed(false);}catch{if(!controller.signal.aborted)setScheduleFailed(true);}finally{pending=false;}};
  const clock=setTimeout(()=>setNow(new Date()),0);const timer=setInterval(()=>void refresh(),60000);
  const visible=()=>{if(document.visibilityState==='visible')void refresh();};document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();clearTimeout(clock);clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[]);
 const stops=journey?.stops.length?journey.stops:(data.stops??[]).map(s=>({...s,number:s.label.match(/^Stop (\d+)/)?.[1],label:s.label.replace(/^Stop \d+ - /,''),state:'upcoming' as const,eta:''}));
 const summary=now?plannerSummary(data,now):null;
 const scheduleCurrent=now&&plannerClock(now).date===data.date&&!scheduleFailed;
 const selectStop=(id:string)=>{setSelected('');requestAnimationFrame(()=>setSelected(id));document.getElementById('journey-map')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 const stop=stops.find(s=>s.id===selected);
 const place=stop?places.find(p=>p.stopId===stop.id&&p.showOnPage!==false):undefined;
 return <main id="main-content" className={`p-container ${styles.page}`}>
  <header className={styles.intro}><p className="p-eyebrow">Route &amp; Live Map</p><h1>Where’s the van?</h1><p>See the van live, find your stop and plan your next ride.</p><p className={styles.metadata}>{stops.length?`${stops.length} stops · `:''}Hop on &amp; off · Live van tracking</p></header>
  <div id="journey-map" className={styles.map}><LiveMapEmbed priority presentation="full" onJourney={setJourney} selectedStopId={selected}/></div>
  {sectionVisible(content,'departures')&&<section className={styles.section} aria-labelledby="journey-departures"><p className="p-eyebrow">Today · Local Shkodra time</p><h2 id="journey-departures">Next departures</h2><p>{scheduleCurrent?summary?.status:'Schedule temporarily unavailable. Check availability when booking.'}</p>{scheduleCurrent&&data.times&&<ul className={styles.times}>{data.times.map(time=><li key={time} data-state={time<=plannerClock(now).time?"past":time===summary?.upcoming?.[0]?"next":"upcoming"}><time>{time}</time><small>{time<=plannerClock(now).time?'Scheduled earlier':time===summary?.upcoming?.[0]?'Next scheduled':'Upcoming'}</small></li>)}</ul>}<p className={styles.note}>Scheduled times are not a seat guarantee. Booking checks current availability and the advance-booking cutoff.</p></section>}
  {sectionVisible(content,'route')&&<section className={styles.section} aria-labelledby="journey-title"><h2 id="journey-title">Your route today</h2>
   <p className={styles.status} role="status">{journey&&!journey.unavailable?'Live stop status from the van map.':'Live stop status is temporarily unavailable. Published stops remain available below; check the map for the latest information.'}</p>
   {stops.length?<ol className={styles.stops}>{stops.map((s,index)=>{const destination=places.find(p=>p.stopId===s.id&&p.showOnPage!==false);return <li key={s.id}><button type="button" aria-pressed={selected===s.id} className={styles.stop} data-state={s.state} onClick={()=>selectStop(s.id)}><span className={styles.number}>{String(index+1).padStart(2,'0')}</span><strong>{s.label}</strong>{(destination?.tag||destination?.text)&&<span className={styles.descriptor}>{destination.tag||destination.text}</span>}<small>{s.state==='current'?'Van at stop':s.state==='next'?`Next${s.eta?` · ${s.eta}`:''}`:s.state==='departed'?'Departed':journey&&!journey.unavailable?'Upcoming':'Stop'} </small></button></li>;})}</ol>:<p>Published stops are temporarily unavailable. You can still use the map and check departures.</p>}
   {stop&&<div className={styles.detail}>{place?.image&&<Image className={styles.thumbnail} src={place.image} alt={place.alt??place.name} width={160} height={110} unoptimized/>}<h3>{place?.name??stop.label}</h3>{place&&<p>{place.text}</p>}<div className="p-button-group">{place&&<ActionLink href={place.link}>Explore destination</ActionLink>}<button className="ss-button" type="button" disabled={!journey} onClick={()=>selectStop(stop.id)}>Show on map</button></div></div>}
  </section>}
  {product&&<section className={styles.ticket} aria-labelledby="journey-ticket"><div><p className="p-eyebrow">{content['intro.eyebrow']}</p><h2 id="journey-ticket">{content['intro.title']}</h2><h3>{product.title}</h3>{product.inclusions&&<ExpandableText text={product.inclusions}/>}<p>{stops.length?`${stops.length} stops · `:''}Live van tracking</p>{sectionVisible(content,'departures')&&<p>Departures today: {scheduleCurrent?(data.times?.length?data.times.join(' · '):summary?.status):'Schedule temporarily unavailable'}</p>}</div><div><BookingPriceIndicator amount={fare?.amount} date={fare?.date} currency={fare?.currency}/><BookButton>{content['nav.book']}</BookButton><p className={styles.note}>Reserve online. Pay at the meeting point.</p></div></section>}
  {!product&&<div className={styles.booking}><BookButton>{content['nav.book']}</BookButton><span>Check ticket details and availability.</span></div>}
 </main>;
}
