'use client';
import {useEffect,useId,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {AmenityIcon} from '@/components/ui/amenity-icon';
import type {productFeatureBadges} from '@/modules/booking/product-features';
import styles from './mobile-amenity-icons.module.css';
type Feature=ReturnType<typeof productFeatureBadges>[number];
const openedEvent='sightseeing:amenity-open';
/** A presentation-only mobile disclosure. The complete published list stays in the existing sheet. */
export function MobileAmenityIcons({features}:{features:Feature[]}){
 const id=useId(),root=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null);
 const buttons=useRef(new Map<string,HTMLButtonElement>());
 const [active,setActive]=useState<string|null>(null),[position,setPosition]=useState<CSSProperties>({visibility:'hidden'});
 const selected=features.find(feature=>feature.key===active);
 useEffect(()=>{
  const closeOther=(event:Event)=>{if((event as CustomEvent).detail!==id)setActive(null);};
  window.addEventListener(openedEvent,closeOther);return()=>window.removeEventListener(openedEvent,closeOther);
 },[id]);
 useEffect(()=>{
  if(!active)return;
  const outside=(event:Event)=>{if(!root.current?.contains(event.target as Node)&&!popup.current?.contains(event.target as Node))setActive(null);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();buttons.current.get(active)?.focus({preventScroll:true});setActive(null);}};
  const dismiss=()=>setActive(null);
  document.addEventListener('pointerdown',outside);document.addEventListener('focusin',outside);document.addEventListener('keydown',escape);
  document.addEventListener('scroll',dismiss,true);window.addEventListener('resize',dismiss);window.visualViewport?.addEventListener('resize',dismiss);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);document.removeEventListener('keydown',escape);document.removeEventListener('scroll',dismiss,true);window.removeEventListener('resize',dismiss);window.visualViewport?.removeEventListener('resize',dismiss);};
 },[active]);
 useLayoutEffect(()=>{
  if(!active||!popup.current)return;
  const button=buttons.current.get(active);if(!button)return;
  const r=button.getBoundingClientRect(),view=window.visualViewport;
  const left=view?.offsetLeft??0,top=view?.offsetTop??0,width=view?.width??document.documentElement.clientWidth;
  const box=popup.current.getBoundingClientRect();
  // Always above the amenity row, clear of the purchase actions below it.
  setPosition({left:Math.max(left+12,Math.min(r.left+r.width/2-box.width/2,left+width-box.width-12)),top:Math.max(top+8,r.top-box.height-8),visibility:'visible'});
 },[active]);
 if(!features.length)return null;
 return <div className={styles.mobile} ref={root} data-mobile-amenities>
  <div className={styles.icons} role="group" aria-label="Included amenities">{features.slice(0,6).map(feature=><button key={feature.key} ref={node=>{if(node)buttons.current.set(feature.key,node);else buttons.current.delete(feature.key);}} type="button" aria-label={feature.label} aria-expanded={active===feature.key} aria-controls={active===feature.key?id:undefined} aria-describedby={active===feature.key?id:undefined} onClick={()=>{setPosition({visibility:'hidden'});setActive(current=>current===feature.key?null:feature.key);window.dispatchEvent(new CustomEvent(openedEvent,{detail:id}));}}><AmenityIcon name={feature.icon}/></button>)}</div>
  <p className={styles.helper}>Tap an icon to see what’s included</p>
  {selected&&createPortal(<div ref={popup} id={id} role="tooltip" className={styles.popover} style={position}>{selected.label}</div>,document.body)}
 </div>;
}
