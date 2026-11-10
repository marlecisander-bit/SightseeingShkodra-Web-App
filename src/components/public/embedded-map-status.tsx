'use client';
import {useState,useSyncExternalStore,type CSSProperties} from 'react';
import {AmenityIcon} from '@/components/ui/amenity-icon';
import {hasLiveJourneyPosition,type EmbeddedDisplay,type JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './embedded-map-status.module.css';
const subscribe=(notify:()=>void)=>{const media=window.matchMedia?.('(min-width:1024px)');media?.addEventListener?.('change',notify);return()=>media?.removeEventListener?.('change',notify);};
function updated(at?:string|null,now=Date.now()){
 const age=now-Date.parse(at??'');if(!Number.isFinite(age)||age<0)return 'Update time unavailable';
 const seconds=Math.floor(age/1000);return seconds<60?`Updated ${seconds}s ago`:seconds<3600?`Updated ${Math.floor(seconds/60)} min ago`:`Updated ${Math.floor(seconds/3600)} h ago`;
}
/** Presentation only: upstream determines all location, ETA and stop-progress facts. */
export function EmbeddedMapStatus({display,snapshot,reason,unavailable,onStop,configuredStops=[]}:{display?:EmbeddedDisplay;snapshot?:JourneySnapshot|null;reason:'stale'|'loading';unavailable:boolean;onStop:(id:string)=>void;configuredStops?:{id:string;label:string}[]}){
 const desktop=useSyncExternalStore(subscribe,()=>window.matchMedia?.('(min-width:1024px)')?.matches??false,()=>false);
 const [expanded,setExpanded]=useState(false);
 const fresh=!!display?.live&&hasLiveJourneyPosition(snapshot);
 const delayed=!!display&&!fresh&&(snapshot?.confidence?.position==='delayed'||!!snapshot?.presentationKind?.startsWith('historical_'));
 const stops:EmbeddedDisplay['stops']=display?.stops.length?display.stops:configuredStops.map((s,i)=>({id:s.id,number:String(i+1),name:s.label,label:'Tracking not confirmed',state:'unknown' as const}));
 const active=fresh?stops.find(s=>s.state==='current')??stops.find(s=>s.state==='approaching'):undefined;
 const next=fresh&&snapshot?.confidence?.eta==='valid'&&['ARRIVING','LEAVING','EN_ROUTE'].includes(snapshot.phase??'')?stops.find(s=>s.state==='approaching'||s.state==='next'):undefined;
 const eta=next&&snapshot?.confidence?.eta==='valid'?display?.eta:'';
 const heading=display?.destination|| (reason==='stale'?'Tracking connection interrupted':unavailable?'Location unavailable':'Connecting to the van…');
 return <section className={styles.panel} aria-label="Van journey information" data-freshness={fresh?'fresh':delayed?'delayed':'unavailable'}>
  <div className={styles.overview}>
   <div className={styles.current}><span className={styles.van}><AmenityIcon name="van"/></span><div>
    <p className={styles.eyebrow}>{fresh?(display?.label||'Current van status'):delayed?'Last known location':'Van status'}</p>
    <h2>{heading}</h2>
    <div className={styles.freshness}><span className={styles.badge}>{fresh?'● Fresh tracking':delayed?'◷ Delayed update':reason==='stale'?'○ Disconnected':unavailable||display?'○ Tracking unavailable':'◷ Connecting'}</span><span>{updated(snapshot?.lastObservationAt)}</span></div>
    {display?.activity&&!/^Updated /.test(display.activity)&&<p className={styles.activity}>{display.activity}</p>}
    {!display&&<p className={styles.activity}>Waiting for a current update from the live map.</p>}
   </div></div>
   <div className={styles.next}><p className={styles.eyebrow}>{next?'Next destination':'Next on route'}</p><strong>{next?.name||display?.nextStop||'Not yet confirmed'}</strong><p className={styles.eta}>{eta||'Arrival estimate unavailable'}</p>{!next&&display?.nextStop&&<small>Route order only · active destination not confirmed</small>}</div>
  </div>
  <details className={styles.disclosure} open={desktop||expanded} onToggle={event=>{if(!desktop)setExpanded(event.currentTarget.open);}}>
   <summary>View all {stops.length} stops <span aria-hidden="true">⌄</span></summary>
   {stops.length?<ol className={styles.timeline} style={{'--stop-count':stops.length} as CSSProperties} aria-label="Configured route stops">{stops.map(stop=>{
    // Only explicit upstream completion/check evidence earns a passed mark.
    const passed=!stop.skipped&&(stop.checked||stop.state==='completed');
    const state=stop.skipped?'skipped':passed?'completed':stop.state;
    const label=stop.skipped?'Not confirmed visited':passed?'Confirmed passed':state==='current'?(fresh?'Current stop':'Last observed stop'):state==='approaching'?(fresh?'Arriving':'Previously approaching'):state==='next'?(fresh?'Next stop':'Next on route'):state==='unknown'?'Tracking not confirmed':'Upcoming';
    return <li key={stop.id} data-state={state}><button type="button" onClick={()=>onStop(stop.id)} aria-current={stop.id===active?.id?'step':undefined} aria-label={`Stop ${stop.number}: ${stop.name}. ${label}`}><span className={styles.node} aria-hidden="true"><span className={styles.marker}>{passed?'✓':state==='current'?<AmenityIcon name="van"/>:null}</span></span><span className={styles.stopCopy}><strong>{stop.name}</strong><small>{label}</small></span></button></li>;
   })}</ol>:<p className={styles.empty}>Configured stops are not available yet.</p>}
  </details>
 </section>;
}
