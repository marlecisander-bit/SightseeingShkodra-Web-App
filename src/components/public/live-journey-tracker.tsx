'use client';

import Image from 'next/image';
import {useId} from 'react';
import {StopSelector} from './stop-selector';

import {sightseeingStops, sightseeingStatus, type StopPlace} from '@/modules/content/sightseeing-stops';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './live-journey-tracker.module.css';

function TrackingVanIcon() {
 return <Image src="/brand/sightseeing-van.svg" alt="" aria-hidden="true" width={64} height={30} unoptimized draggable={false}/>;
}

/** Presentation only: selection never changes the iframe's authoritative journey. */
export function LiveJourneyTracker({stops, places, journey, stale=false, showStatus=true, onMap, learnLabel='Explore destination', mapLabel='View on map'}: {
 stops:readonly {id:string;label:string}[]; places:readonly StopPlace[];
 journey?:JourneySnapshot|null; stale?:boolean; showStatus?:boolean; onMap?:(id:string)=>void;
 learnLabel?:string; mapLabel?:string;
}) {
 const selectorId=useId();
 const items=sightseeingStops(stops,places,!stale?journey:null);
 const current=items.find(s=>s.state==='current');
 const next=items.find(s=>s.state==='next');
 const label=(state:string)=>state==='current'?'Van here':state==='next'?'Next stop':state==='departed'?'Departure confirmed':'Upcoming';
 return <div className={styles.tracker}>
  {showStatus&&<section className={styles.status} aria-label="Live journey status">
   <div className={styles.summary}>
    <span className={styles.vehicle}><TrackingVanIcon/></span>
    <div role="status">
     <p className={styles.eyebrow}><span className={styles.dot} data-live={!!journey&&!journey.unavailable&&!stale&&(!journey.confidence||journey.confidence.position==='live')}/>Live journey</p>
     <h3>{!stale&&next&&!current?`Next destination: ${next.name}`:sightseeingStatus(items,journey,stale)}</h3>
     {!stale&&journey&&!journey.unavailable&&next&&<p>Next stop: {next.number} of {items.length}{current?` · ${next.name}`:''}</p>}
     {!stale&&!current&&next?.eta&&<p className={styles.eta}>ETA: {next.eta}</p>}
    </div>
   </div>
   {!!items.length&&<ol className={styles.progress} aria-label="Live stop progression">{items.map(s=><li key={s.id} data-state={s.state} aria-label={`Stop ${s.number}: ${s.name}. ${label(s.state)}`}><button type="button" aria-label={`Browse stop ${s.number}: ${s.name}`} onClick={()=>(document.getElementById(selectorId)?.querySelectorAll<HTMLButtonElement>('ol button')[s.number-1])?.click()}>{s.state==='departed'?'✓':s.number}</button>{(s.state==='current'||(!current&&s.state==='next'))&&<i data-moving={!current}><TrackingVanIcon/></i>}</li>)}</ol>}
  </section>}
  <div id={selectorId}><StopSelector items={items} onMap={onMap} learnLabel={learnLabel} mapLabel={mapLabel}/></div>
 </div>;
}
