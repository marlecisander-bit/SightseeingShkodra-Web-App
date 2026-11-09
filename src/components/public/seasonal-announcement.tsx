'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {seasonalActive,seasonalDefaults} from '@/modules/content/seasonal-announcement';
import styles from './seasonal-announcement.module.css';

type Props={content:Record<string,string>;initialActive:boolean;children?:ReactNode;preview?:boolean};
export function SeasonalAnnouncement({content,initialActive,children,preview=false}:Props){
 const c={...seasonalDefaults,...content};
 const [active,setActive]=useState(initialActive),[open,setOpen]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const titleId=useId(),descriptionId=useId();
 useEffect(()=>{
  if(preview)return;
  const refresh=()=>setActive(seasonalActive(content));
  const timer=window.setInterval(refresh,15000);
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[content,preview]);
 useEffect(()=>{
  if(!open||!active)return;
  const el=dialog.current;if(!el)return;
  const previous=document.body.style.overflow;const opener=trigger.current;
  document.body.style.overflow='hidden';el.showModal();
  return()=>{el.close();document.body.style.overflow=previous;opener?.focus({preventScroll:true});};
 },[open,active]);
 if(!active)return children;
 return <div className={styles.frame} data-seasonal-announcement>
  <div className={styles.ribbon} aria-label="Seasonal announcement">
   <span className={styles.snow} aria-hidden="true">❄</span>
   <span><strong>{c['seasonal.title']}</strong><span className={styles.desktop}> · {c['seasonal.shortSeason']} <span aria-hidden="true">|</span></span> <span className={styles.mobile} aria-hidden="true">·</span> {c['seasonal.message']} <span aria-hidden="true">·</span> <button ref={trigger} type="button" aria-haspopup="dialog" onClick={()=>setOpen(true)}>{c['seasonal.learnMore']} <span aria-hidden="true">→</span></button></span>
  </div>
  {children}
  <dialog className={styles.dialog} ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={event=>{if(event.key!=='Tab')return;const items=event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]');const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)setOpen(false);}}>
   <div className={styles.panel}>
    <button className={styles.close} type="button" aria-label={c['seasonal.close']} onClick={()=>setOpen(false)} autoFocus>×</button>
    <p className={styles.season}><span aria-hidden="true">❄</span> {c['seasonal.season']}</p>
    <h2 id={titleId}>{c['seasonal.popupTitle']}</h2>
    <p className={styles.description} id={descriptionId}>{c['seasonal.description']}</p>
    <div className={styles.facts}><div><h3><span aria-hidden="true">◷</span> {c['seasonal.departuresLabel']}</h3><p className={styles.times}>{c['seasonal.departures']}</p></div>
    <div><h3><span aria-hidden="true">⌖</span> {c['seasonal.stopsLabel']}</h3><ol>{c['seasonal.stops'].split('\n').filter(s=>s.trim()).map((stop,i)=><li key={i}>{stop}</li>)}</ol></div></div>
    <div className={styles.notice}><h3><span aria-hidden="true">ⓘ</span> {c['seasonal.noticeLabel']}</h3><p>{c['seasonal.notice']}</p></div>
    <Link className={styles.action} href="/#experiences" onClick={()=>setOpen(false)}>{c['seasonal.action']} <span aria-hidden="true">→</span></Link>
   </div>
  </dialog>
 </div>;
}
