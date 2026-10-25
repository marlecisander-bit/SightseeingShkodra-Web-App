'use client';
import {useId,useRef,useState} from 'react';
import {sightseeingStops,type StopPlace} from '@/modules/content/sightseeing-stops';
import {StopPortrait} from './stop-portrait';
import styles from './homepage-stops-gallery.module.css';

/** Editorial discovery only: never receives or follows a journey snapshot. */
export function HomepageStopsGallery({stops,places,learnLabel='Explore this stop'}:{stops:readonly {id:string;label:string}[];places:readonly StopPlace[];learnLabel?:string}){
 const items=sightseeingStops(stops,places);
 const [selected,setSelected]=useState<string|null>(null),[active,setActive]=useState(0);
 const rail=useRef<HTMLOListElement>(null),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
 const dragged=useRef(false),touch=useRef<{x:number;y:number}|null>(null);
 const titleId=useId(),detailId=useId();
 const chosen=items.find(s=>s.id===selected);
 const go=(index:number)=>{const list=rail.current,node=list?.children[index] as HTMLElement|undefined;if(!list||!node)return;list.scrollTo({left:list.scrollLeft+node.getBoundingClientRect().left-list.getBoundingClientRect().left-(list.clientWidth-node.offsetWidth)/2,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 return <div className={styles.gallery} data-homepage-discovery>
  {!items.length&&<p>Published stops are temporarily unavailable.</p>}
  <ol ref={rail} className={styles.rail} aria-label="Discover the sightseeing stops" onScroll={event=>{const list=event.currentTarget,center=list.getBoundingClientRect().left+list.clientWidth/2;let nearest=0,distance=Infinity;Array.from(list.children).forEach((node,i)=>{const r=node.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-center);if(d<distance){distance=d;nearest=i;}});setActive(nearest);}} onTouchStart={event=>{const t=event.touches[0];touch.current={x:t.clientX,y:t.clientY};dragged.current=false;}} onTouchMove={event=>{const t=event.touches[0],start=touch.current;if(start&&Math.abs(t.clientX-start.x)>10)dragged.current=true;}} onKeyDown={event=>{const target=event.key==='ArrowLeft'?Math.max(0,active-1):event.key==='ArrowRight'?Math.min(items.length-1,active+1):event.key==='Home'?0:event.key==='End'?items.length-1:null;if(target!==null){event.preventDefault();go(target);(rail.current?.children[target]?.querySelector('button'))?.focus({preventScroll:true});}}}>
   {items.map(s=><li key={s.id} data-stop-id={s.id}><button type="button" className={styles.stop} aria-label={`Stop ${s.number}: ${s.name}. Show details`} aria-haspopup="dialog" aria-controls={detailId} onPointerDown={()=>{dragged.current=false;}} onClick={event=>{if(dragged.current)return;trigger.current=event.currentTarget;setSelected(s.id);dialog.current?.showModal();}}><StopPortrait number={s.number} name={s.name} image={s.place?.image} alt={s.place?.alt}/></button></li>)}
  </ol>
  {items.length>1&&<div className={styles.navigation}><button type="button" aria-label="Previous stop" disabled={active===0} onClick={()=>go(active-1)}>←</button><span aria-live="polite">Stop {active+1} of {items.length}</span><button type="button" aria-label="Next stop" disabled={active===items.length-1} onClick={()=>go(active+1)}>→</button></div>}
  <dialog ref={dialog} id={detailId} className={styles.detail} aria-labelledby={titleId} onClose={()=>{setSelected(null);trigger.current?.focus({preventScroll:true});}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.current?.close();}}}>
   <button className={styles.close} type="button" autoFocus onClick={()=>dialog.current?.close()} aria-label="Close stop information">Close ×</button>
   <h3 id={titleId}>{chosen?.name}</h3><p>{chosen?.place?.text||'Destination details are not yet published.'}</p>{chosen?.place&&<a className="ss-button" href={chosen.place.link}>{learnLabel} →</a>}
  </dialog>
 </div>;
}
