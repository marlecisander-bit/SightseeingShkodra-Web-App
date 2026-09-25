'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import type { GuestReview, ReviewSelection } from '@/modules/content/reviews';
import { Button } from '@/components/ui/button';
import styles from './guest-reviews.module.css';
export function ReviewCard({review:r}:{review:GuestReview}) {
 const [expanded,setExpanded]=useState(false);
 return <article className={styles.card} lang={r.language??undefined}>
  <p className={styles.stars} aria-label={`${r.rating} out of 5 stars`}><span aria-hidden="true">{'\u2605'.repeat(r.rating)}{'\u2606'.repeat(5-r.rating)}</span></p>
  <blockquote className={expanded?styles.expanded:styles.quote}>{r.body}</blockquote>
  {(r.body.length>140||r.body.split("\n").length>4)&&<Button type="button" className={styles.readMore} aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Read less':'Read more'}</Button>}
  <div className={styles.author}>{r.avatar_url&&<Image unoptimized src={r.avatar_url} alt="" width={40} height={40} loading="lazy"/>}<strong>{r.author}</strong></div>
  <p className={styles.source}>{r.source}{r.review_date&&<> | <time dateTime={r.review_date}>{new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(r.review_date+'T12:00:00Z'))}</time></>}</p>
  {r.original_url&&<a href={r.original_url} target="_blank" rel="noopener noreferrer" className={styles.original}>View original<span className={styles.srOnly}> (opens in a new tab)</span></a>}
 </article>;
}
export function GuestReviews({selection,eyebrow='LOVED BY OUR GUESTS',title='Your stories belong here.',subtitle='Real experiences from people who explored Shkodra with us.'}:{selection:ReviewSelection;eyebrow?:string;title?:string;subtitle?:string}) {
 const rail=useRef<HTMLDivElement>(null),[active,setActive]=useState(0);
 if(!selection.reviews.length)return null;
 return <section className={`${styles.section} p-section`} aria-label="Guest reviews"><div className="p-container">
 <p className="p-eyebrow">{eyebrow}</p><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}<p className={styles.curated}>A curated selection of guest reviews from the sources shown.</p>
 <div className={styles.rail} ref={rail} onScroll={()=>{const el=rail.current;if(el){const cards=Array.from(el.children) as HTMLElement[];let closest=0;cards.forEach((card,i)=>{if(Math.abs(card.offsetLeft-el.scrollLeft)<Math.abs(cards[closest].offsetLeft-el.scrollLeft))closest=i;});setActive(closest);}}}>
 {selection.reviews.map(r=><ReviewCard key={r.id} review={r}/>)}</div>
 <div className={styles.dots} aria-label="Choose review">{selection.reviews.map((r,i)=><button key={r.id} type="button" aria-label={`Show review ${i+1}`} aria-pressed={active===i} onClick={()=>{const el=rail.current,card=el?.children[i] as HTMLElement|undefined;if(el&&card)el.scrollTo({left:card.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}><span/></button>)}</div>
 <div className={styles.actions}>{selection.settings.google_reviews_url&&<a className="ss-button" href={selection.settings.google_reviews_url} target="_blank" rel="noopener noreferrer">See all reviews on Google Maps</a>}{selection.settings.leave_review_url&&<a className="ss-button" href={selection.settings.leave_review_url} target="_blank" rel="noopener noreferrer">Leave a review</a>}</div>
 </div></section>;
}
