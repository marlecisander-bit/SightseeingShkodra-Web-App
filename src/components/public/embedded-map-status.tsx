import type {EmbeddedDisplay} from '@/modules/tracking/journey-contract';
import styles from './live-map.module.css';

/** Exact upstream display projection; this component never interprets tracking evidence. */
export function EmbeddedMapStatus({display, reason, unavailable, onStop}: {display?:EmbeddedDisplay;reason:'stale'|'loading';unavailable:boolean;onStop:(id:string)=>void}) {
 const active=display?.stops.find(s=>s.state==='current')??display?.stops.find(s=>s.state==='approaching'||s.state==='next');
 return <section className={styles.statusPanel} aria-label="Live van status">
  <div className={styles.statusCopy} role="status" aria-live="polite" aria-atomic="true">
   {display ? <><span className={styles.context}>{display.live?'Live · ':''}{display.label}</span><strong>{display.destination}</strong>{display.activity&&<span>{display.activity}</span>}</> : <><strong>{reason==='stale'?'Live status temporarily unavailable':unavailable?'Live status unavailable':'Connecting to live map…'}</strong><span>Waiting for a current update from the live map.</span></>}
  </div>
  {display&&((display.nextStop&&display.nextStop!==display.destination)||display.eta)&&<div className={styles.statusTiming}>{display.nextStop&&display.nextStop!==display.destination&&<span>Next: {display.nextStop}</span>}{display.eta&&<span>{display.eta}</span>}</div>}
  {display&&display.stops.length>0&&<ol className={styles.statusProgress} aria-label="Tour stop progress">{display.stops.map(stop=><li key={stop.id} data-state={stop.state}><button type="button" onClick={()=>onStop(stop.id)} aria-current={stop.id===active?.id?'step':undefined} aria-label={`Stop ${stop.number}: ${stop.name}. ${stop.label}`} title={`${stop.name} · ${stop.label}`}>{stop.state==='completed'?'✓':stop.number}</button></li>)}</ol>}
 </section>;
}
