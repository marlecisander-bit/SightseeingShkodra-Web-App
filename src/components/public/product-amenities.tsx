'use client';
import {useCallback,useEffect,useId,useRef,useState,type MouseEvent,type ReactNode,type RefObject} from 'react';
import {createPortal} from 'react-dom';
import {AmenityIcon} from '@/components/ui/amenity-icon';
import type {productFeatureBadges} from '@/modules/booking/product-features';
import cardStyles from './product-booking-cards.module.css';
import styles from './product-amenities.module.css';
type Feature=ReturnType<typeof productFeatureBadges>[number];

/** Keep full CMS facts on larger screens and concise facts with full details on phones. */
export function ProductAmenities({features,title,summary=false,note,details,detailsAction=false}:{features:Feature[];title:string;summary?:boolean;note?:string;details?:ReactNode;detailsAction?:boolean}){
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const opener=useRef<HTMLButtonElement|null>(null);
 const [count,setCount]=useState(2),[open,setOpen]=useState(false);
 const id=useId();
 const close=useCallback(()=>setOpen(false),[]);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  if(summary){
   const phone=window.matchMedia('(max-width:599px), (max-width:900px) and (max-height:500px) and (orientation:landscape) and (pointer:coarse)');
   const update=()=>{setCount(phone.matches?Math.min(2,features.length):features.length);if(window.innerWidth>=600&&opener.current?.hasAttribute('data-phone-details'))opener.current=trigger.current;if(!phone.matches)close();};
   update();phone.addEventListener('change',update);return()=>phone.removeEventListener('change',update);
  }
  const phone=window.matchMedia('(max-width:599px), (max-width:900px) and (max-height:500px) and (orientation:landscape) and (pointer:coarse)');let frame=0,active=true;
  const measure=()=>{
   frame=0;if(!phone.matches){close();return;}if(document.querySelector('dialog[open]'))return;
   // Preserve the existing compact tablet-landscape presentation.
   if(window.innerWidth>=600){setCount(Math.min(2,features.length));return;}
   const card=node.closest('article'),body=node.parentElement,list=node.querySelector('ul'),hero=node.closest('#home-hero');
   if(!card||!body||!list||!hero)return;
   const visual=hero.firstElementChild,rail=card.parentElement;
   // Share CSS's stable small-viewport budget. Safari toolbar and keyboard
   // resize events must not trade chips for photo height while scrolling.
   const minimum=visual?parseFloat(getComputedStyle(visual).minHeight):0;
   const height=Number.isFinite(minimum)&&minimum>0?minimum:window.innerHeight;
   const pagination=hero.querySelector('[aria-label="Choose experience"]');
   const reserve=(pagination?.getBoundingClientRect().height??0)+parseFloat(getComputedStyle(visual??hero).paddingBottom)+(rail?parseFloat(getComputedStyle(rail).paddingBottom):0);
   const available=height-(card.getBoundingClientRect().top+window.scrollY)-reserve;
   const bodyStyle=getComputedStyle(body),children=Array.from(body.children).filter(child=>child!==node&&!child.matches('dialog')&&getComputedStyle(child).display!=='none');
   // A growing photo can give its spare height to chips. Floating status badges
   // do not consume flow space and must not reduce the amenities budget.
   const photoHeight=Array.from(card.children).filter(child=>child!==body&&!['absolute','fixed'].includes(getComputedStyle(child).position)).reduce((sum,child)=>{
    const css=getComputedStyle(child);
    return sum+(css.flexGrow==='1'?parseFloat(css.minHeight):child.getBoundingClientRect().height);
   },0);
   const base=photoHeight+parseFloat(bodyStyle.paddingTop)+parseFloat(bodyStyle.paddingBottom)
    +children.reduce((sum,child)=>sum+child.getBoundingClientRect().height,0)
    +parseFloat(bodyStyle.rowGap)*children.length+2;
   node.dataset.measuring='true';
   const top=list.getBoundingClientRect().top;
   const bottoms=Array.from(list.children,child=>child.getBoundingClientRect().bottom-top);
   delete node.dataset.measuring;
   // Keep the first measured row on very short screens; never leave chips
   // hidden beside a visible chip when they occupy the same row.
   const nextRow=bottoms.findIndex(bottom=>bottom>bottoms[0]+0.5);
   let visible=nextRow<0?features.length:nextRow;
   for(let n=visible;n<=features.length;n++){
    const disclosure=n<features.length?Math.max(44,trigger.current?.getBoundingClientRect().height??0):0;
    if(base+bottoms[n-1]+disclosure<=available)visible=n;
   }
   if(visible===features.length&&document.activeElement===trigger.current)body.querySelector<HTMLElement>('[data-product-details]>summary')?.focus({preventScroll:true});
   setCount(previous=>previous===visible?previous:visible);
  };
  const queue=()=>{if(active&&!frame)frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(queue);observer.observe(node.parentElement!);observer.observe(node.querySelector('ul')!);
  const hero=node.closest('#home-hero');if(hero)observer.observe(hero);
  const textObserver=new MutationObserver(queue);textObserver.observe(node.querySelector('ul')!,{characterData:true,childList:true,subtree:true});
  document.addEventListener('close',queue,true);window.addEventListener('resize',queue);phone.addEventListener('change',queue);
  void document.fonts.ready.then(queue);if(!open)queue();
  return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();textObserver.disconnect();document.removeEventListener('close',queue,true);window.removeEventListener('resize',queue);phone.removeEventListener('change',queue);};
 },[features,close,open,summary]);
 const show=(event:MouseEvent<HTMLButtonElement>)=>{opener.current=event.currentTarget;setOpen(true);};
 const label=features.length?'All amenities':'Tour details';
 return <div ref={root} className={styles.amenities} data-summary={summary||undefined} data-feature-count={features.length} data-visible-count={Math.min(count,features.length)}>
  <ul className={cardStyles.badges} aria-label={title+' information'}>{features.map((feature,index)=><li key={feature.key} data-amenity-visible={index<count}><AmenityIcon name={feature.icon}/><span>{feature.label}</span></li>)}</ul>
  <div className={styles.summaryInfo}>
   {summary&&<span className={styles.summaryNote}>{note}</span>}
   <button ref={trigger} type="button" className={styles.all} data-all-amenities hidden={!summary&&count>=features.length} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?id:undefined} aria-label={label+' for '+title} onClick={show}>{label}</button>
  </div>
  {summary&&detailsAction&&<button type="button" className={`${cardStyles.book} ${cardStyles.secondaryAction} ${cardStyles.phoneDetailsAction}`} data-phone-details aria-haspopup="dialog" aria-expanded={open} aria-controls={open?id:undefined} aria-label={'Tour details for '+title} onClick={show}>Tour details</button>}
  {open&&createPortal(<AmenitiesSheet id={id} features={features} title={title} details={details} summary={summary} onClose={close} trigger={opener}/>,document.body)}
 </div>;

}
function restoreOpener(trigger:RefObject<HTMLButtonElement|null>){const node=trigger.current;if(node?.isConnected)node.focus({preventScroll:true});}
function AmenitiesSheet({id,features,title,details,summary,onClose,trigger}:{id:string;features:Feature[];title:string;details?:ReactNode;summary?:boolean;onClose:()=>void;trigger:RefObject<HTMLButtonElement|null>}){
 const dialog=useRef<HTMLDialogElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const node=dialog.current;if(!node)return;
  const html=document.documentElement,overflow=html.style.overflow,x=window.scrollX,y=window.scrollY;
  html.style.overflow='hidden';node.showModal();closeButton.current?.focus({preventScroll:true});
  return()=>{node.close();html.style.overflow=overflow;window.scrollTo({left:x,top:y,behavior:'instant'});restoreOpener(trigger);};
 },[trigger]);
 return <dialog ref={dialog} id={id} className={styles.sheet} aria-labelledby={id+'-title'} aria-describedby={id+'-product'} onKeyDown={event=>{if(event.key!=='Tab')return;const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button,a[href],[tabindex="0"]')).filter(n=>n.getClientRects().length);const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}} onClose={event=>{if(!event.currentTarget.open)onClose();}} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientY<r.top||event.clientY>r.bottom||event.clientX<r.left||event.clientX>r.right)onClose();}}>
  <header><div><h2 id={id+'-title'}>{summary?'Tour details':'All amenities'}</h2><p id={id+'-product'}>{title}</p></div><button ref={closeButton} type="button" aria-label="Close amenities" onClick={onClose}>×</button></header>
  <div className={styles.contents} tabIndex={0} role="region" aria-label="Amenities list">{details}{summary&&features.length>0&&<h3>All amenities</h3>}<ul>{features.map(feature=><li key={feature.key}><AmenityIcon name={feature.icon}/><span>{feature.label}</span></li>)}</ul></div>
 </dialog>;
}
