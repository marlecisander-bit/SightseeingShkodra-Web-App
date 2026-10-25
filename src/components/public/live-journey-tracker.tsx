'use client';

import Image from 'next/image';
import {StopPortrait} from './stop-portrait';
import {useEffect, useId, useRef, useState} from 'react';
import {sightseeingStops, sightseeingStatus, type StopPlace} from '@/modules/content/sightseeing-stops';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './live-journey-tracker.module.css';

function TrackingVanIcon() {
 return <Image src="/brand/sightseeing-van.svg" alt="" aria-hidden="true" width={64} height={30} unoptimized draggable={false}/>;
}

/** Presentation only: selection never changes the iframe's authoritative journey. */
export function LiveJourneyTracker({stops, places, journey, stale=false, onMap, learnLabel='Learn more', mapLabel='View on map'}: {
 stops:readonly {id:string;label:string}[]; places:readonly StopPlace[];
 journey?:JourneySnapshot|null; stale?:boolean; onMap?:(id:string)=>void;
 learnLabel?:string; mapLabel?:string;
}) {
 const [selected,setSelected]=useState<string|null>(null);
 const [following,setFollowing]=useState(true);
 const rail=useRef<HTMLOListElement>(null);
 const gesture=useRef<{x:number;y:number}|null>(null);
 const dragged=useRef(false);
 const detailId=useId();
 const triggers=useRef(new Map<string,HTMLButtonElement>());
 const items=sightseeingStops(stops,places,!stale?journey:null);
 const current=items.find(s=>s.state==='current');
 const next=items.find(s=>s.state==='next');
 const chosen=items.find(s=>s.id===selected);
 const target=current?.id||next?.id;
 const center=(id:string|undefined)=>{
  const list=rail.current;
  const node=Array.from(list?.children??[]).find(node=>(node as HTMLElement).dataset.stopId===id) as HTMLElement|undefined;
  if(list&&node&&list.scrollWidth>list.clientWidth)list.scrollTo({left:list.scrollLeft+node.getBoundingClientRect().left-list.getBoundingClientRect().left-(list.clientWidth-node.offsetWidth)/2,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
 useEffect(()=>{if(!following)return;center(target);const resize=()=>center(target);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[target,following]);
 const label=(state:string)=>state==='current'?'Van here':state==='next'?'Next stop':state==='departed'?'Departure confirmed':'Upcoming';
 const close=()=>{setSelected(null);if(selected)triggers.current.get(selected)?.focus();};
 return <div className={styles.tracker}>
  <section className={styles.status} aria-label="Live journey status">
   <div className={styles.summary}>
    <span className={styles.vehicle}><TrackingVanIcon/></span>
    <div role="status">
     <p className={styles.eyebrow}><span className={styles.dot} data-live={!!journey&&!journey.unavailable&&!stale}/>Live journey</p>
     <h3>{!stale&&next&&!current?`Next destination: ${next.name}`:sightseeingStatus(items,journey,stale)}</h3>
     {!stale&&journey&&!journey.unavailable&&next&&<p>Next stop: {next.number} of {items.length}{current?` · ${next.name}`:''}</p>}
     {!stale&&!current&&next?.eta&&<p className={styles.eta}>ETA: {next.eta}</p>}
    </div>
   </div>
   {!!items.length&&<ol className={styles.progress} aria-label="Live stop progression">{items.map(s=><li key={s.id} data-state={s.state} aria-label={`Stop ${s.number}: ${s.name}. ${label(s.state)}`}><button type="button" aria-label={`Browse stop ${s.number}: ${s.name}`} onClick={()=>{setFollowing(false);center(s.id);}}>{s.state==='departed'?'✓':s.number}</button>{(s.state==='current'||(!current&&s.state==='next'))&&<i data-moving={!current}><TrackingVanIcon/></i>}</li>)}</ol>}
  </section>
  {!items.length&&<p>Published stops are temporarily unavailable.</p>}
  {!following&&target&&<button type="button" className={styles.follow} onClick={()=>{setFollowing(true);center(target);}}>Follow van</button>}
  <ol ref={rail} className={styles.timeline} onTouchStart={event=>{const touch=event.touches[0];gesture.current={x:touch.clientX,y:touch.clientY};dragged.current=false;}} onTouchMove={event=>{const touch=event.touches[0];const start=gesture.current;if(start&&Math.abs(touch.clientX-start.x)>10&&Math.abs(touch.clientX-start.x)>Math.abs(touch.clientY-start.y)){dragged.current=true;setFollowing(false);}}} onPointerDown={event=>{gesture.current={x:event.clientX,y:event.clientY};dragged.current=false;}} onPointerMove={event=>{const start=gesture.current;if(start&&Math.abs(event.clientX-start.x)>10&&Math.abs(event.clientX-start.x)>Math.abs(event.clientY-start.y)){dragged.current=true;setFollowing(false);}}} onPointerUp={()=>{gesture.current=null;}} onWheel={event=>{if(Math.abs(event.deltaX)>0)setFollowing(false);}} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))setFollowing(false);}} tabIndex={0} aria-label="Choose a destination">{items.map(s=><li key={s.id} data-state={s.state} data-stop-id={s.id}>
   <button ref={node=>{if(node)triggers.current.set(s.id,node);else triggers.current.delete(s.id);}} type="button" className={styles.stop} aria-expanded={selected===s.id} aria-controls={detailId} onClick={()=>{if(!dragged.current)setSelected(selected===s.id?null:s.id);}}>
    <StopPortrait number={s.number} name={s.name} image={s.place?.image} alt={s.place?.alt}>{(s.state==='current'||(!current&&s.state==='next'))&&<span className={styles.here} data-moving={!current}><TrackingVanIcon/></span>}{s.state==='departed'&&<span className={styles.confirmed} aria-label="Departure confirmed">✓</span>}</StopPortrait>
    <span className={styles.copy}>{s.place?.tag&&<span className={styles.subtitle}>{s.place.tag}</span>}{s.place?.text&&<span className={styles.description}>{s.place.text}</span>}<span className={styles.badge}>{label(s.state)}</span></span>
   </button>{s.place&&<a className={styles.learn} href={s.place.link}>{learnLabel} →</a>}
  </li>)}</ol>
  <div id={detailId}>{chosen&&<section className={styles.detail} aria-label={`${chosen.name} details`} onKeyDown={event=>{if(event.key==='Escape')close();}}>
   {chosen.place?.image&&<Image className={styles.landscape} src={chosen.place.image} alt={chosen.place.alt||chosen.name} width={720} height={450} sizes="(max-width: 700px) 90vw, 35vw"/>}
   <div className={styles.detailCopy}><p className={styles.eyebrow}>Stop {chosen.number} of {items.length}</p><h3>{chosen.name}</h3><p>{chosen.place?.text||'Destination details are not yet published.'}</p>{chosen.place&&<a href={chosen.place.link}>{learnLabel} →</a>}</div>
   <div className={styles.actions}>{onMap?<button className="ss-button" type="button" onClick={()=>onMap(chosen.id)}>{mapLabel}</button>:<a className="ss-button" href="/route">{mapLabel}</a>}<button className="ss-button" type="button" onClick={()=>{const following=items[(items.indexOf(chosen)+1)%items.length];setSelected(following.id);triggers.current.get(following.id)?.focus();}}>Next stop →</button><button className={styles.close} type="button" onClick={close}>Close details</button></div>
  </section>}</div>
 </div>;
}
