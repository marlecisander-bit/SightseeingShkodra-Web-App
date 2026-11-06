'use client';
import {useCallback,useEffect,useId,useRef,useState,type RefObject} from 'react';
import {createPortal} from 'react-dom';
import {AmenityIcon} from '@/components/ui/amenity-icon';
import type {productFeatureBadges} from '@/modules/booking/product-features';
import cardStyles from './product-booking-cards.module.css';
import styles from './product-amenities.module.css';
type Feature=ReturnType<typeof productFeatureBadges>[number];

/** One desktop/CMS feature list; phone disclosure is sized from its rendered labels. */
export function ProductAmenities({features,title}:{features:Feature[];title:string}){
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [count,setCount]=useState(2),[open,setOpen]=useState(false);
 const id=useId();
 const close=useCallback(()=>setOpen(false),[]);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  const phone=window.matchMedia('(max-width:599px), (max-width:900px) and (max-height:500px) and (orientation:landscape) and (pointer:coarse)');let frame=0,active=true;
  const measure=()=>{
   frame=0;if(!phone.matches){close();return;}if(document.querySelector('dialog[open]'))return;
   const card=node.closest('article'),body=node.parentElement,list=node.querySelector('ul'),hero=node.closest('#home-hero');
   if(!card||!body||!list||!hero)return;
   const height=Math.min(window.innerHeight,window.visualViewport?.height??window.innerHeight);
   const compact=window.innerWidth<=375||height<=740;
   const pagination=hero.querySelector('[aria-label="Choose experience"]');
   const visual=hero.firstElementChild,rail=card.parentElement;
   const reserve=(pagination?.getBoundingClientRect().height??0)+parseFloat(getComputedStyle(visual??hero).paddingBottom)+(rail?parseFloat(getComputedStyle(rail).paddingBottom):0)+4;
   const available=height-(card.getBoundingClientRect().top+window.scrollY)-reserve;
   const bodyStyle=getComputedStyle(body),children=Array.from(body.children).filter(child=>child!==node&&!child.matches('dialog')&&getComputedStyle(child).display!=='none');
   const base=Array.from(card.children).filter(child=>child!==body).reduce((sum,child)=>sum+child.getBoundingClientRect().height,0)+parseFloat(bodyStyle.paddingTop)+parseFloat(bodyStyle.paddingBottom)+children.reduce((sum,child)=>sum+child.getBoundingClientRect().height,0)+parseFloat(bodyStyle.rowGap)*children.length+2;
   node.dataset.measuring='true';
   const top=list.getBoundingClientRect().top;
   const bottoms=Array.from(list.children,child=>child.getBoundingClientRect().bottom-top);
   delete node.dataset.measuring;
   const maximum=compact?Math.min(2,features.length):features.length;
   let visible=Math.min(2,features.length);
   for(let n=visible;n<=maximum;n++){
    const disclosure=n<features.length?Math.max(44,trigger.current?.getBoundingClientRect().height??0):0;
    if(base+bottoms[n-1]+disclosure<=available)visible=n;
   }
   if(visible===features.length&&document.activeElement===trigger.current)body.querySelector<HTMLElement>('[data-product-details]>summary')?.focus({preventScroll:true});
   setCount(previous=>previous===visible?previous:visible);
  };
  const queue=()=>{if(active&&!frame)frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(queue);observer.observe(node.parentElement!);observer.observe(node.querySelector('ul')!);
  const textObserver=new MutationObserver(queue);textObserver.observe(node.querySelector('ul')!,{characterData:true,childList:true,subtree:true});
  document.addEventListener('close',queue,true);window.addEventListener('resize',queue);window.visualViewport?.addEventListener('resize',queue);phone.addEventListener('change',queue);
  void document.fonts.ready.then(queue);if(!open)queue();
  return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();textObserver.disconnect();document.removeEventListener('close',queue,true);window.removeEventListener('resize',queue);window.visualViewport?.removeEventListener('resize',queue);phone.removeEventListener('change',queue);};
 },[features,close,open]);
 return <div ref={root} className={styles.amenities} data-visible-count={Math.min(count,features.length)}>
  <ul className={cardStyles.badges} aria-label={title+' information'}>{features.map((feature,index)=><li key={feature.key} data-amenity-visible={index<count}><AmenityIcon name={feature.icon}/><span>{feature.label}</span></li>)}</ul>
  <button ref={trigger} type="button" className={styles.all} data-all-amenities hidden={count>=features.length} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?id:undefined} aria-label={'All amenities for '+title} onClick={()=>setOpen(true)}>All amenities</button>
  {open&&createPortal(<AmenitiesSheet id={id} features={features} title={title} onClose={close} trigger={trigger}/>,document.body)}
 </div>;
}
function AmenitiesSheet({id,features,title,onClose,trigger}:{id:string;features:Feature[];title:string;onClose:()=>void;trigger:RefObject<HTMLButtonElement|null>}){
 const dialog=useRef<HTMLDialogElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const node=dialog.current;if(!node)return;
  const opener=trigger.current,html=document.documentElement,overflow=html.style.overflow,x=window.scrollX,y=window.scrollY;
  html.style.overflow='hidden';node.showModal();closeButton.current?.focus({preventScroll:true});
  return()=>{node.close();html.style.overflow=overflow;window.scrollTo({left:x,top:y,behavior:'instant'});opener?.focus({preventScroll:true});};
 },[trigger]);
 return <dialog ref={dialog} id={id} className={styles.sheet} aria-labelledby={id+'-title'} aria-describedby={id+'-product'} onKeyDown={event=>{if(event.key!=='Tab')return;const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button,a[href],[tabindex="0"]')).filter(n=>n.getClientRects().length);const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}} onClose={event=>{if(!event.currentTarget.open)onClose();}} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientY<r.top||event.clientY>r.bottom||event.clientX<r.left||event.clientX>r.right)onClose();}}>
  <header><div><h2 id={id+'-title'}>All amenities</h2><p id={id+'-product'}>{title}</p></div><button ref={closeButton} type="button" aria-label="Close amenities" onClick={onClose}>×</button></header>
  <div className={styles.contents} tabIndex={0} role="region" aria-label="Amenities list"><ul>{features.map(feature=><li key={feature.key}><AmenityIcon name={feature.icon}/><span>{feature.label}</span></li>)}</ul></div>
 </dialog>;
}
