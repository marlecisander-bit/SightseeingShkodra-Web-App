import type {CSSProperties} from 'react';
import type {EmbeddedDisplay} from '@/modules/tracking/journey-contract';
import styles from './live-map.module.css';

function stopInk(color?:string) {
 const hex=/^#[0-9a-f]{6}$/i.test(color||'')?color!:'#526476';
 const rgb=hex.slice(1).match(/../g)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?'#000':'#fff';
}

/** Exact upstream display projection; this component never interprets tracking evidence. */
export function EmbeddedMapStatus({display, reason, unavailable, onStop}: {display?:EmbeddedDisplay;reason:'stale'|'loading';unavailable:boolean;onStop:(id:string)=>void}) {
 const active=display?.stops.find(s=>s.state==='current')??display?.stops.find(s=>s.state==='approaching'||s.state==='next');
 return <section className={styles.statusPanel} aria-label="Live van status">
  <div className={styles.statusCopy} role="status" aria-live="polite" aria-atomic="true">
   {display ? <><span className={styles.context}>{display.live?'Live · ':''}{display.label}</span><strong>{display.destination}</strong>{display.activity&&<span>{display.activity}</span>}</> : <><strong>{reason==='stale'?'Live status temporarily unavailable':unavailable?'Live status unavailable':'Connecting to live map…'}</strong><span>Waiting for a current update from the live map.</span></>}
  </div>
  {display&&((display.nextStop&&display.nextStop!==display.destination)||display.eta)&&<div className={styles.statusTiming}>{display.nextStop&&display.nextStop!==display.destination&&<span className={styles.nextStop}>Next on route: {display.nextStop}</span>}{display.eta&&<span>{display.eta}</span>}</div>}
  {display&&display.stops.length>0&&<ol className={styles.statusProgress} aria-label="Tour stop progress">{display.stops.map(stop=><li key={stop.id} data-state={stop.skipped?'skipped':stop.state} style={{'--stop-color':stop.color||'#526476','--stop-ink':stopInk(stop.color)} as CSSProperties}><button type="button" onClick={()=>onStop(stop.id)} aria-current={stop.id===active?.id?'step':undefined} aria-label={`Stop ${stop.number}: ${stop.name}. ${stop.label}`} title={`${stop.name} · ${stop.label}`}>{stop.checked?'✓':stop.number}</button></li>)}</ol>}
 </section>;
}
