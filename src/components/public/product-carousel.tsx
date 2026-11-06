"use client";

import {useCallback,useEffect,useId,useRef,useState,type ReactNode,type PointerEvent as ReactPointerEvent} from "react";
import styles from "./product-booking-cards.module.css";

/** Native scrolling: any number of published offers, no autoplay or vertical gesture interception. */
export function ProductCarousel({children,titles}:{children:ReactNode;titles:string[]}) {
  const rail=useRef<HTMLDivElement>(null),id=useId();
  const drag=useRef<{pointerId:number;x:number;y:number;left:number;active:boolean}|null>(null);
  const suppressClick=useRef(false);
  const stopDrag=useRef<(()=>void)|null>(null);
  useEffect(()=>()=>{stopDrag.current?.();drag.current=null;},[]);
  const [view,setView]=useState({active:0,overflow:false,start:true,end:true});
  const measure=useCallback(()=>{
    const node=rail.current;if(!node)return;
    const bounds=node.getBoundingClientRect(),rtl=node.ownerDocument.defaultView?.getComputedStyle(node).direction==="rtl";
    const distances=Array.from(node.children,child=>{const r=child.getBoundingClientRect();return Math.abs(rtl?r.right-bounds.right:r.left-bounds.left);});
    const next={active:Math.max(0,distances.indexOf(Math.min(...distances))),overflow:node.scrollWidth>node.clientWidth+1,start:Math.abs(node.scrollLeft)<=2,end:Math.abs(node.scrollLeft)>=node.scrollWidth-node.clientWidth-2};
    setView(old=>Object.keys(next).every(key=>old[key as keyof typeof old]===next[key as keyof typeof next])?old:next);
  },[]);
  useEffect(()=>{
    measure();
    if(typeof ResizeObserver==="undefined")return;
    const observer=new ResizeObserver(measure);if(rail.current)observer.observe(rail.current);
    return()=>observer.disconnect();
  },[measure,titles.length]);
  function browse(index:number){
    const node=rail.current,card=node?.children[index];if(!node||!card)return;
    const a=node.getBoundingClientRect(),b=card.getBoundingClientRect(),rtl=node.ownerDocument.defaultView?.getComputedStyle(node).direction==="rtl";
    node.scrollTo({left:node.scrollLeft+(rtl?b.right-a.right:b.left-a.left),behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  }
  function page(direction:number){
    const node=rail.current;if(!node)return;
    const sign=node.ownerDocument.defaultView?.getComputedStyle(node).direction==="rtl"?-1:1;
    node.scrollBy({left:direction*sign*node.clientWidth,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  }
  function startDrag(event:ReactPointerEvent<HTMLDivElement>){
    const node=event.currentTarget;
    if(event.pointerType!=="mouse"||event.button!==0||node.scrollWidth<=node.clientWidth+1)return;
    if(event.target instanceof Element&&event.target.closest('a,button,input,select,textarea,summary,details,dialog,[contenteditable],[role="button"],[role="link"]'))return;
    drag.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,left:node.scrollLeft,active:false};
    const move=(next:PointerEvent)=>moveDrag(node,next);
    const end=(next:PointerEvent)=>finishDrag(node,next.pointerId);
    const blur=()=>finishDrag(node,event.pointerId);
    const doc=node.ownerDocument;
    doc.addEventListener('pointermove',move,true);doc.addEventListener('pointerup',end,true);doc.addEventListener('pointercancel',end,true);doc.addEventListener('lostpointercapture',end,true);window.addEventListener('blur',blur);
    stopDrag.current=()=>{
      doc.removeEventListener('pointermove',move,true);doc.removeEventListener('pointerup',end,true);doc.removeEventListener('pointercancel',end,true);doc.removeEventListener('lostpointercapture',end,true);window.removeEventListener('blur',blur);delete node.dataset.dragging;
      if(node.hasPointerCapture?.(event.pointerId))node.releasePointerCapture(event.pointerId);
    };
    // Document listeners also cover browsers/input drivers that do not retain capture.
    try{node.setPointerCapture(event.pointerId);}catch{/* The document fallback remains active. */}
  }
  function moveDrag(node:HTMLDivElement,event:PointerEvent){
    const gesture=drag.current;if(!gesture||gesture.pointerId!==event.pointerId)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.active){
      if(Math.max(Math.abs(dx),Math.abs(dy))<6)return;
      if(Math.abs(dy)>Math.abs(dx)){finishDrag(node,event.pointerId);return;}
      gesture.active=true;suppressClick.current=true;node.dataset.dragging="true";
      const selection=window.getSelection();if(selection?.anchorNode&&node.contains(selection.anchorNode))selection.removeAllRanges();
    }
    event.preventDefault();node.scrollLeft=gesture.left-dx;
  }
  function finishDrag(node:HTMLDivElement,pointerId:number){
    const gesture=drag.current;if(!gesture||gesture.pointerId!==pointerId)return;
    const bounds=node.getBoundingClientRect(),rtl=getComputedStyle(node).direction==="rtl";
    const distances=Array.from(node.children,child=>{const r=child.getBoundingClientRect();return Math.abs(rtl?r.right-bounds.right:r.left-bounds.left);});
    const nearest=Math.max(0,distances.indexOf(Math.min(...distances)));
    drag.current=null;const stop=stopDrag.current;stopDrag.current=null;stop?.();
    if(gesture.active)browse(nearest);
  }
  return <div className={styles.carousel} data-overflow={view.overflow} data-count={titles.length}>
    {view.overflow&&<div className={styles.navigation} role="group" aria-label="Browse experiences"><button type="button" aria-label="Previous experiences" aria-controls={id} disabled={view.start} onClick={()=>page(-1)}>‹</button><button type="button" aria-label="Next experiences" aria-controls={id} disabled={view.end} onClick={()=>page(1)}>›</button></div>}
    <div ref={rail} id={id} className={styles.grid} onScroll={measure} onPointerDownCapture={event=>{if(drag.current)finishDrag(event.currentTarget,drag.current.pointerId);suppressClick.current=false;}} onPointerDown={startDrag} onDragStart={event=>{if(drag.current)event.preventDefault();}} onClickCapture={event=>{if(suppressClick.current&&event.detail>0){event.preventDefault();event.stopPropagation();suppressClick.current=false;}}}>{children}</div>
    {titles.length>1&&<div className={styles.pagination} role="group" aria-label="Choose experience">{titles.map((title,index)=><button type="button" key={index} aria-label={`Show ${title}`} aria-controls={id} aria-current={view.active===index?"true":undefined} onClick={()=>browse(index)}><span/></button>)}</div>}
  </div>;
}
