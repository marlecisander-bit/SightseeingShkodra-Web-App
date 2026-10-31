'use client';
import Image from 'next/image';
import {useId,useRef,useState} from 'react';
import type {sightseeingStops} from '@/modules/content/sightseeing-stops';
import {StopPortrait} from './stop-portrait';
import styles from './stop-selector.module.css';

type Stop=ReturnType<typeof sightseeingStops>[number];
/** Editorial selection is independent of tracking state and never follows GPS updates. */
export function StopSelector({items,onMap,learnLabel='Explore destination',mapLabel='View on map'}:{items:Stop[];onMap?:(id:string)=>void;learnLabel?:string;mapLabel?:string}){
 const [selected,setSelected]=useState<string|null>(null);
 const chosen=items.find(item=>item.id===selected)??items[0];
 const rail=useRef<HTMLOListElement>(null),buttons=useRef(new Map<string,HTMLButtonElement>());
 const gesture=useRef<{x:number;y:number}|null>(null),dragged=useRef(false);
 const detailId=useId(),titleId=useId();
 const choose=(item:Stop,focus=false)=>{
  setSelected(item.id);
  const node=buttons.current.get(item.id),list=rail.current;
  if(focus)node?.focus({preventScroll:true});
  if(node&&list&&list.scrollWidth>list.clientWidth){const box=node.getBoundingClientRect(),bounds=list.getBoundingClientRect();list.scrollTo({left:list.scrollLeft+box.left-bounds.left-(list.clientWidth-box.width)/2,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 };
 if(!chosen)return <p>Published stops are temporarily unavailable.</p>;
 return <div className={styles.selector}>
  <ol ref={rail} className={styles.rail} aria-label="Choose a destination" onTouchStart={event=>{const t=event.touches[0];gesture.current={x:t.clientX,y:t.clientY};dragged.current=false;}} onTouchMove={event=>{const t=event.touches[0],start=gesture.current;if(start&&Math.abs(t.clientX-start.x)>10&&Math.abs(t.clientX-start.x)>Math.abs(t.clientY-start.y))dragged.current=true;}}>
   {items.map((item,index)=><li key={item.id}><button ref={node=>{if(node)buttons.current.set(item.id,node);else buttons.current.delete(item.id);}} type="button" className={styles.stop} aria-pressed={chosen.id===item.id} aria-controls={detailId} aria-label={`Stop ${item.number}: ${item.name}`} onPointerDown={()=>{dragged.current=false;}} onKeyDown={event=>{const next=event.key==='ArrowLeft'?Math.max(0,index-1):event.key==='ArrowRight'?Math.min(items.length-1,index+1):event.key==='Home'?0:event.key==='End'?items.length-1:null;if(next!==null){event.preventDefault();choose(items[next],true);}}} onClick={()=>{if(!dragged.current)choose(item);}}><StopPortrait compact number={item.number} name={item.name.replace(/^Stop \d+\s*[-–]\s*/i,'')} image={item.place?.image} alt={item.place?.alt}/></button></li>)}
  </ol>
  <section id={detailId} className={styles.detail} aria-labelledby={titleId}>
   <DestinationImage image={chosen.place?.image} alt={chosen.place?.alt||chosen.name}/>
   <div className={styles.copy}>
    <p className={styles.count} role="status" aria-live="polite" aria-atomic="true" aria-label={`Stop ${chosen.number} of ${items.length}: ${chosen.name}`}>Stop {chosen.number} of {items.length}</p>
    <h3 id={titleId}>{chosen.name}</h3><p>{chosen.place?.text||'Destination details are not yet published.'}</p>
    <div className={styles.actions}>{chosen.place&&<a className="p-button" href={chosen.place.link}>{learnLabel}</a>}
     {onMap?<button type="button" className={styles.map} onClick={()=>onMap(chosen.id)}><MapPin/>{mapLabel}</button>:<a className={styles.map} href="/route"><MapPin/>{mapLabel}</a>}
    </div>
   </div>
  </section>
 </div>;
}
function MapPin(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;}

function DestinationImage({image,alt}:{image?:string;alt:string}){
 const [failed,setFailed]=useState<string>();
 return <div className={styles.image}>{image&&failed!==image?<Image src={image} alt={alt} width={720} height={450} sizes="(max-width: 700px) 90vw, 40vw" onError={()=>setFailed(image)}/>:<span>Photo coming soon</span>}</div>;
}
