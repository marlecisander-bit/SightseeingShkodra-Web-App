'use client';
import {useState} from 'react';
import {BookingProvider,Header} from '@/components/public/booking';
import {initialWebsiteContent} from '@/modules/content/website-schema';
import {LiveJourneyTracker} from '@/components/public/live-journey-tracker';
import {HomepageJourney,HomepageJourneyProvider} from '@/components/public/homepage-journey';
import {RouteJourney} from '@/components/public/route-journey';
import type {StopPlace} from '@/modules/content/sightseeing-stops';
export function StopsReview({stops,places}:{stops:{id:string;label:string}[];places:StopPlace[]}){
 const [current,setCurrent]=useState(0),[long,setLong]=useState(false),[missing,setMissing]=useState(false),[unavailable,setUnavailable]=useState(false),[mapped,setMapped]=useState(''),[mode,setMode]=useState('section');
 const data=places.map(p=>({...p,...(long?{name:p.name+' · A longer translated destination name that wraps naturally across several lines'}:{}),...(missing?{image:p.stopId===stops[0].id?'':'/images/review-not-found.webp'}:{})}));
 const journey={type:'shkodra:journey' as const,version:1 as const,unavailable,stops:stops.map((s,i)=>({...s,state:(i===current?'current':i<current?'departed':'upcoming') as 'current'|'departed'|'upcoming',eta:''}))};
 const content=initialWebsiteContent;
 return <div className="public-site"><BookingProvider content={content}><Header content={content}/>
 <div className="p-container" style={{paddingTop:24}}><p>Local review · current public CMS snapshot, simulated tracking, no data writes.</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><button onClick={()=>setCurrent(v=>(v+1)%5)}>Advance tracking</button><button onClick={()=>setLong(v=>!v)}>Long labels</button><button onClick={()=>setMissing(v=>!v)}>Missing images</button><button onClick={()=>setUnavailable(v=>!v)}>Map unavailable</button><select aria-label="Review placement" value={mode} onChange={e=>setMode(e.target.value)}><option value="section">Stops section</option><option value="home">Homepage component</option><option value="route">Actual Route component</option></select></div><p data-map-selection>{mapped?`Map selection: ${mapped}`:''}</p></div>
 {mode==='route'?<RouteJourney content={content} initial={{date:'2026-10-31',title:'Local review',times:null,fares:[],stops}} places={data.map(p=>({...p,showOnPage:true}))}/>:<main className="p-container" style={{paddingBlock:32}}><section aria-labelledby="review-stops-title"><p className="p-eyebrow">{content['route.eyebrow']}</p><h2 id="review-stops-title">{content['route.title']}</h2><p>{content['route.text']}</p>{mode==='home'?<HomepageJourneyProvider><HomepageJourney stops={stops} places={data} onMap={setMapped} learnLabel={content['labels.destination']}/></HomepageJourneyProvider>:<LiveJourneyTracker stops={stops} places={data} journey={journey} showStatus={false} onMap={setMapped} learnLabel={content['labels.destination']}/>}</section></main>}
 </BookingProvider></div>;
}
