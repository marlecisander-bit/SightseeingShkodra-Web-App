"use client";

import {useCallback,useEffect,useId,useRef,useState,type ReactNode} from "react";
import styles from "./product-booking-cards.module.css";

/** Native scrolling: any number of published offers, no autoplay or vertical gesture interception. */
export function ProductCarousel({children,titles}:{children:ReactNode;titles:string[]}) {
  const rail=useRef<HTMLDivElement>(null),id=useId();
  const [view,setView]=useState({active:0,overflow:false,start:true,end:true});
  const measure=useCallback(()=>{
    const node=rail.current;if(!node)return;
    const bounds=node.getBoundingClientRect(),rtl=node.ownerDocument.defaultView?.getComputedStyle(node).direction==="rtl";
    const distances=Array.from(node.children,child=>{const r=child.getBoundingClientRect();return Math.abs(rtl?r.right-bounds.right:r.left-bounds.left);});
    const next={active:Math.max(0,distances.indexOf(Math.min(...distances))),overflow:node.scrollWidth>node.clientWidth+1,start:Math.abs(node.scrollLeft)<2,end:Math.abs(node.scrollLeft)>=node.scrollWidth-node.clientWidth-2};
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
  return <div className={styles.carousel} data-overflow={view.overflow} data-count={titles.length}>
    {view.overflow&&<div className={styles.navigation} role="group" aria-label="Browse experiences"><button type="button" aria-label="Previous experiences" aria-controls={id} disabled={view.start} onClick={()=>page(-1)}>‹</button><button type="button" aria-label="Next experiences" aria-controls={id} disabled={view.end} onClick={()=>page(1)}>›</button></div>}
    <div ref={rail} id={id} className={styles.grid} onScroll={measure}>{children}</div>
    {titles.length>1&&<div className={styles.pagination} role="group" aria-label="Choose experience">{titles.map((title,index)=><button type="button" key={index} aria-label={`Show ${title}`} aria-controls={id} aria-current={view.active===index?"true":undefined} onClick={()=>browse(index)}><span/></button>)}</div>}
  </div>;
}
