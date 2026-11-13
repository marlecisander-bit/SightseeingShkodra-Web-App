'use client';

import {MapVanIcon} from './map-van-icon';
import {useId} from 'react';
import {StopSelector} from './stop-selector';

import {sightseeingStops, sightseeingStatus, type StopPlace} from '@/modules/content/sightseeing-stops';
import {hasLiveJourneyPosition,type JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './live-journey-tracker.module.css';

/** Presentation only: selection never changes the iframe's authoritative journey. */
export function LiveJourneyTracker({stops, places, journey, stale=false, showStatus=true, onMap, learnLabel='Explore destination', mapLabel='View on map',cards=false}: {
 cards?:boolean; stops:readonly {id:string;label:string}[]; places:readonly StopPlace[];
 journey?:JourneySnapshot|null; stale?:boolean; showStatus?:boolean; onMap?:(id:string)=>void;
 learnLabel?:string; mapLabel?:string;
}) {
 const selectorId=useId();
 const live=!stale&&hasLiveJourneyPosition(journey);
 const reliableEta=live&&journey?.confidence?.eta==='valid'&&['ARRIVING','LEAVING','EN_ROUTE'].includes(journey.phase||'');
 const items=sightseeingStops(stops,places,(cards?live:!stale)?journey:null);
 const lastKnown=journey?.stops.find(s=>s.state==='current');
 const sequenceNext=items[(journey?.stops.findIndex(s=>s.state==='current')??-1)+1];
 const current=items.find(s=>s.state==='current');
 const next=items.find(s=>s.state==='next');
 const label=(state:string)=>state==='current'?'Van here':state==='next'?'Next stop':state==='departed'?'Departure confirmed':'Upcoming';
 return <div className={styles.tracker}>
  {showStatus&&<section className={styles.status} aria-label="Live journey status">
   <div className={styles.summary}>
    <span className={styles.vehicle}><MapVanIcon/></span>
    <div role="status">
     <p className={styles.eyebrow}><span className={styles.dot} data-live={live}/>{(!cards||live)?'Live journey':lastKnown?'Last known stop':'Tracking unavailable'}</p>
     <h3>{(!cards||live)?(!stale&&next&&!current&&(!cards||reliableEta)?`Next destination: ${next.name}`:sightseeingStatus(items,journey,stale)):(stale?'Live connection interrupted':journey?.movement)||lastKnown?.label||'Live updates temporarily unavailable'}</h3>
     {!stale&&journey&&!journey.unavailable&&next&&<p>{cards&&!reliableEta?'Next on route':'Next stop'}: {next.number} of {items.length}{current?` · ${next.name}`:''}</p>}
     {(!cards||reliableEta)&&!current&&next?.eta?<p className={styles.eta}>ETA: {next.eta}</p>:<p>Next on route: {sequenceNext?.name||'Unavailable'} · ETA unavailable</p>}
    </div>
   </div>
   {!!items.length&&<ol className={styles.progress} aria-label="Live stop progression">{items.map(s=><li key={s.id} data-state={s.state} aria-label={`Stop ${s.number}: ${s.name}. ${label(s.state)}`}><button type="button" aria-label={`Browse stop ${s.number}: ${s.name}`} onClick={()=>(document.getElementById(selectorId)?.querySelectorAll<HTMLButtonElement>('ol button')[s.number-1])?.click()}><span>{s.state==='departed'?'✓':s.number}</span></button></li>)}</ol>}
  </section>}
  <div id={selectorId}><StopSelector cards={cards} items={items} onMap={onMap} learnLabel={learnLabel} mapLabel={mapLabel}/></div>
 </div>;
}
