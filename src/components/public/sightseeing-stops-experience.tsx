'use client';
import Image from 'next/image';
import {useId,useRef,useState} from 'react';
import {sightseeingStops,sightseeingStatus,type StopPlace} from '@/modules/content/sightseeing-stops';
import type {JourneySnapshot} from '@/modules/tracking/journey-contract';
import styles from './sightseeing-stops.module.css';
function VanIcon(){return <svg aria-hidden="true" width="24" height="18" viewBox="0 0 32 24" fill="none"><path d="M3 4h18l7 7v8H3V4Z" fill="currentColor"/><path d="M6 7h6v5H6zm9 0h5l5 5H15Z" fill="white"/><circle cx="9" cy="19" r="4" fill="currentColor" stroke="white" strokeWidth="2"/><circle cx="23" cy="19" r="4" fill="currentColor" stroke="white" strokeWidth="2"/></svg>;}
export function SightseeingStopsExperience({mode,stops,places,journey,stale=false,onMap,learnLabel='Learn more',mapLabel='View on map'}:{mode:'live'|'discover';stops:readonly {id:string;label:string}[];places:readonly StopPlace[];journey?:JourneySnapshot|null;stale?:boolean;onMap?:(id:string)=>void;learnLabel?:string;mapLabel?:string}){
 const [selected,setSelected]=useState('');const [active,setActive]=useState(0);const list=useRef<HTMLOListElement>(null);const detailId=useId();const trigger=useRef<HTMLButtonElement|null>(null);const close=()=>{setSelected('');trigger.current?.focus();};
 const items=sightseeingStops(stops,places,mode==='live'&&!stale?journey:null);const chosen=items.find(s=>s.id===selected);const parked=items.some(s=>s.state==='current');
 const go=(index:number)=>{const node=list.current?.children[index];if(node instanceof HTMLElement){node.scrollIntoView({block:'nearest',inline:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});setActive(index);}};
 return <div className={styles.experience} data-mode={mode} data-floating-obstacle>
  {mode==='live'&&<p className={styles.status} role="status"><span><VanIcon/></span>{sightseeingStatus(items,journey,stale)}</p>}
  {!items.length&&<p>Published stops are temporarily unavailable.</p>}
  <ol ref={list} className={styles.stops} onScroll={event=>{if(mode!=='discover')return;const el=event.currentTarget;const children=Array.from(el.children) as HTMLElement[];const nearest=children.reduce((best,node,i)=>Math.abs(node.offsetLeft-el.offsetLeft-el.scrollLeft)<Math.abs(children[best].offsetLeft-el.offsetLeft-el.scrollLeft)?i:best,0);setActive(nearest);}}>{items.map(s=><li key={s.id} data-state={s.state}>
   <button className={styles.card} type="button" aria-expanded={selected===s.id} aria-controls={detailId} onClick={event=>{trigger.current=event.currentTarget;setSelected(selected===s.id?'':s.id);}}>
    <span className={styles.photo}>{s.place?.image?<Image src={s.place.image} alt={s.place.alt||s.name} width={180} height={180} unoptimized/>:<span className={styles.placeholder}>Photo coming soon</span>}<span className={styles.number}>{s.number}</span>{s.state==='current'&&<span className={styles.van}><VanIcon/>Van here</span>}</span>
    <span className={styles.copy}><strong>{s.name}</strong><span className={styles.description}>{s.place?.text||'Discover this stop on the route.'}</span>{mode==='live'&&<small className={styles.badge}>{s.state==='current'?'Van at stop':s.state==='next'?`NEXT${!parked&&s.eta?` · ${s.eta}`:''}`:s.state==='departed'?'Departure confirmed':'Stop '+s.number}</small>}</span>
   </button>{mode==='discover'&&s.place&&<a className={styles.learn} href={s.place.link}>{learnLabel} →</a>}
  </li>)}</ol>
  {mode==='discover'&&items.length>1&&<div className={styles.controls} aria-label="Choose a stop"><button type="button" aria-label="Previous stop" disabled={active===0} onClick={()=>go(active-1)}>←</button>{items.map((s,i)=><button key={s.id} type="button" aria-label={`Show stop ${s.number}: ${s.name}`} aria-current={active===i?'true':undefined} onClick={()=>go(i)}><span/></button>)}<button type="button" aria-label="Next stop" disabled={active===items.length-1} onClick={()=>go(active+1)}>→</button></div>}
  <div id={detailId}>{chosen&&<section className={styles.detail} aria-label={`${chosen.name} details`} onKeyDown={event=>{if(event.key==='Escape')close();}}>
   {chosen.place?.image&&<Image src={chosen.place.image} alt={chosen.place.alt||chosen.name} width={400} height={260} unoptimized/>}<div><p className="p-eyebrow">Stop {chosen.number}</p><h3>{chosen.name}</h3><p>{chosen.place?.text||'Destination details are not yet published.'}</p>{mode==='live'&&<p>{chosen.state==='current'?'Van at this stop':chosen.state==='departed'?'Departure confirmed':chosen.state==='next'?`Next stop${!parked&&chosen.eta?` · ${chosen.eta}`:''}`:'No confirmed live status for this stop.'}</p>}<div className={styles.actions}>{chosen.place&&<a className="ss-button" href={chosen.place.link}>{learnLabel}</a>}{mode==='live'?<button className="ss-button" type="button" onClick={()=>onMap?.(chosen.id)}>{mapLabel}</button>:<a className="ss-button" href="/route">{mapLabel}</a>}<button className="ss-button" type="button" onClick={close}>Close details</button></div></div>
  </section>}</div>
 </div>;
}
