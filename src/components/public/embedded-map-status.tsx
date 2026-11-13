'use client';
import {MapVanIcon} from './map-van-icon';
import {useId,useState,type CSSProperties} from 'react';
import {hasLiveJourneyPosition,type EmbeddedDisplay,type JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './embedded-map-status.module.css';
function updated(at?:string|null,now=Date.now()){
 const age=now-Date.parse(at??'');if(!Number.isFinite(age)||age<0)return 'Update time unavailable';
 const seconds=Math.floor(age/1000);return seconds<60?`Updated ${seconds}s ago`:seconds<3600?`Updated ${Math.floor(seconds/60)} min ago`:`Updated ${Math.floor(seconds/3600)} h ago`;
}
/** Presentation only: upstream determines all location, ETA and stop-progress facts. */
export function EmbeddedMapStatus({display,snapshot,reason,unavailable,onStop,configuredStops=[]}:{display?:EmbeddedDisplay;snapshot?:JourneySnapshot|null;reason:'stale'|'loading';unavailable:boolean;onStop:(id:string)=>void;configuredStops?:{id:string;label:string}[]}){
 const [expanded,setExpanded]=useState(false),routeId=useId();
 const fresh=reason!=='stale'&&!!display?.live&&hasLiveJourneyPosition(snapshot);
 const delayed=!!display&&!fresh&&(snapshot?.confidence?.position==='delayed'||!!snapshot?.presentationKind?.startsWith('historical_'));
 const stops:EmbeddedDisplay['stops']=display?.stops.length?display.stops:configuredStops.map((s,i)=>({id:s.id,number:String(i+1),name:s.label,label:'Tracking not confirmed',state:'unknown' as const}));
 const active=fresh?stops.find(s=>s.state==='current')??stops.find(s=>s.state==='approaching'):undefined;
 const next=fresh&&snapshot?.confidence?.eta==='valid'&&['ARRIVING','LEAVING','EN_ROUTE'].includes(snapshot.phase??'')?stops.find(s=>s.state==='approaching'||s.state==='next'):undefined;
 const eta=next&&snapshot?.confidence?.eta==='valid'?display?.eta:'';
 const observed=stops.find(s=>s.state==='current')??stops.find(s=>s.state==='approaching');
 const lastKnown=!fresh&&(delayed||!!observed&&snapshot?.presentationKind!=='unavailable');
 const reported=display?.destination.replace(/^(?:At stop\s*[:·]\s*|Arriving at\s+)/i,'');
 const heading=active?.name||(lastKnown?observed?.name||reported:display?.destination)|| (reason==='stale'?'Tracking connection interrupted':unavailable?'Location unavailable':'Connecting to the van…');
 const trackingDetails=<div className={styles.trackingCopy}>
  {display?.destination&&heading!==display.destination&&<p>{display.destination}</p>}
  <p>{display?.activity&&!/^Updated /.test(display.activity)?display.activity:!display?'Waiting for a current update from the live map.':fresh?'Location supported by fresh tracking data.':'A current van location is not confirmed.'}</p>
  {!next&&display?.nextStop&&<p>Route order only · active destination not confirmed.</p>}
 </div>;
 return <section className={styles.panel} aria-label="Van journey information" data-freshness={fresh?'fresh':delayed?'delayed':'unavailable'}>
  <div className={styles.overview}>
   <div className={styles.current}><span className={styles.van} aria-hidden="true"><MapVanIcon/></span><div>
    <p className={styles.eyebrow}>{fresh?(display?.label||'Current van status'):lastKnown?'Last known stop':'Van status'}</p>
    <h2>{heading}</h2>
    <div className={styles.freshness}><span className={styles.badge}>{fresh?'● LIVE':delayed?'◷ Delayed':reason==='stale'?'○ Disconnected':unavailable||display?'○ Tracking unavailable':'◷ Connecting'}</span><span>{updated(snapshot?.lastObservationAt)}</span></div>
   </div></div>
   <div className={styles.next}><p className={styles.eyebrow}>{next?'Next destination':'Next on route'}</p><strong>{next?.name||display?.nextStop||'Not yet confirmed'}</strong><p className={styles.eta}>{eta||'ETA unavailable'}</p></div>
   <details className={styles.tracking}><summary aria-label="Tracking details">Details <span aria-hidden="true">⌄</span></summary>{trackingDetails}</details>
  </div>
  <div className={styles.disclosure}>
   <button className={styles.toggle} type="button" aria-expanded={expanded} aria-controls={routeId} onClick={()=>setExpanded(value=>!value)}>View {stops.length} stops <span aria-hidden="true">⌄</span></button>
   <div id={routeId} className={styles.routeContent} data-expanded={expanded}>
   {stops.length?<ol className={styles.timeline} style={{'--stop-count':stops.length} as CSSProperties} aria-label="Configured route stops">{stops.map(stop=>{
    // Only explicit upstream completion/check evidence earns a passed mark.
    const passed=!stop.skipped&&(stop.checked||stop.state==='completed');
    const historical=!fresh&&(stop.state==='current'||stop.state==='approaching');
    const state=stop.skipped?'skipped':passed?'completed':historical?'historical':stop.state;
    const label=stop.skipped?'Not confirmed visited':passed?'Confirmed passed':historical?'Last known stop':state==='current'?'Current stop':state==='approaching'?'Arriving':state==='next'?(fresh?'Next stop':'Next on route'):state==='unknown'?'Tracking not confirmed':'Upcoming';
    return <li key={stop.id} data-state={state}><button type="button" onClick={()=>onStop(stop.id)} aria-current={stop.id===active?.id?'step':undefined} aria-label={`Stop ${stop.number}: ${stop.name}. ${label}`}><span className={styles.node} aria-hidden="true"><span className={styles.marker}>{passed?'✓':state==='current'?<MapVanIcon/>:null}</span></span><span className={styles.stopCopy}><strong>{stop.name}</strong></span></button></li>;
   })}</ol>:<p className={styles.empty}>Configured stops are not available yet.</p>}
   <div className={styles.mobileTracking}>{trackingDetails}</div>
   </div>
  </div>
 </section>;
}
