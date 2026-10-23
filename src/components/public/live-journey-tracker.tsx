'use client';

import Image from 'next/image';
import {useId, useRef, useState} from 'react';
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
 const detailId=useId();
 const triggers=useRef(new Map<string,HTMLButtonElement>());
 const items=sightseeingStops(stops,places,!stale?journey:null);
 const current=items.find(s=>s.state==='current');
 const next=items.find(s=>s.state==='next');
 const chosen=items.find(s=>s.id===selected);
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
   {!!items.length&&<ol className={styles.progress} aria-label="Live stop progression">{items.map(s=><li key={s.id} data-state={s.state} aria-label={`Stop ${s.number}: ${s.name}. ${label(s.state)}`}><span>{s.state==='departed'?'✓':s.number}</span>{s.state==='current'&&<i><TrackingVanIcon/></i>}</li>)}</ol>}
  </section>
  {!items.length&&<p>Published stops are temporarily unavailable.</p>}
  <ol className={styles.timeline} aria-label="Choose a destination">{items.map(s=><li key={s.id} data-state={s.state}>
   <button ref={node=>{if(node)triggers.current.set(s.id,node);else triggers.current.delete(s.id);}} type="button" className={styles.stop} aria-expanded={selected===s.id} aria-controls={detailId} onClick={()=>setSelected(selected===s.id?null:s.id)}>
    <span className={styles.photo}>{s.place?.image?<Image src={s.place.image} alt={s.place.alt||s.name} width={160} height={160} sizes="(max-width: 700px) 76px, 112px"/>:<span className={styles.noPhoto}>Stop {s.number}</span>}<span className={styles.number}>{s.state==='departed'?'✓':s.number}</span>{s.state==='current'&&<span className={styles.here}><TrackingVanIcon/></span>}</span>
    <span className={styles.copy}><strong>{s.name}</strong>{s.place?.tag&&<span className={styles.subtitle}>{s.place.tag}</span>}{s.place?.text&&<span className={styles.description}>{s.place.text}</span>}<span className={styles.badge}>{label(s.state)}</span></span>
   </button>
  </li>)}</ol>
  <div id={detailId}>{chosen&&<section className={styles.detail} aria-label={`${chosen.name} details`} onKeyDown={event=>{if(event.key==='Escape')close();}}>
   {chosen.place?.image&&<Image className={styles.landscape} src={chosen.place.image} alt={chosen.place.alt||chosen.name} width={720} height={450} sizes="(max-width: 700px) 90vw, 35vw"/>}
   <div className={styles.detailCopy}><p className={styles.eyebrow}>Stop {chosen.number} of {items.length}</p><h3>{chosen.name}</h3><p>{chosen.place?.text||'Destination details are not yet published.'}</p>{chosen.place&&<a href={chosen.place.link}>{learnLabel} →</a>}</div>
   <div className={styles.actions}><button className="ss-button" type="button" onClick={()=>onMap?.(chosen.id)}>{mapLabel}</button><button className="ss-button" type="button" onClick={()=>{const following=items[(items.indexOf(chosen)+1)%items.length];setSelected(following.id);triggers.current.get(following.id)?.focus();}}>Next stop →</button><button className={styles.close} type="button" onClick={close}>Close details</button></div>
  </section>}</div>
 </div>;
}
