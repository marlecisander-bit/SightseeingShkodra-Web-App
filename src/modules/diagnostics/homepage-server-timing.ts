import 'server-only';
import {cache} from 'react';
import {randomUUID} from 'node:crypto';

// Private, opt-in local/Preview diagnostics. Never enable by request input.
// Production activation needs a separately reviewed instrumentation release.
export function homepageTimingEnabled(env:NodeJS.ProcessEnv=process.env) {
  return env.HOMEPAGE_SERVER_TIMING==='true' && env.VERCEL_ENV!=='production';
}
const operations = [
  'layout','layout.content.await','layout.reviews.await','layout.meeting.await','layout.products.await',
  'page','page.publication.await','page.data.await','page.home.await','page.reviews.await','page.planner.await','page.places.await','page.partners.await','page.products.await',
  'request.connection.await','metadata','metadata.publication.await','hero.preload.register','page.jsx.ready',
  'website.factory','website.query','homepage.factory','homepage.query','homepage.next-date.query',
  'products.factory','products.query','meeting.factory','meeting.query','reviews.context.factory','reviews.factory','reviews.settings.query','reviews.rows.query',
  'destinations.factory','destinations.query','partners.load','partners.query','planner.load','planner.home.await','planner.stops.await','planner.products.await','planner.inventory.query','planner.schedules.query','planner.times.query',
  'map-stops.load','map-stops.project.query','map-stops.version.query','availability.query',
] as const;
export type HomepageTimingOperation=typeof operations[number];
const allowed=new Set<string>(operations);
type Event={component:'homepage_server_timing';requestId:string;span:number;operation:HomepageTimingOperation;phase:'start'|'end';atMs:number;durationMs?:number;outcome?:'resolved'|'rejected'};
export function createHomepageTimingSession(write:(event:Event)=>void,clock:()=>number=()=>performance.now(),requestId=randomUUID()) {
  const origin=clock();let sequence=0;
  function emit(event:Event){try{write(event);}catch{/* Observability must not break a public read. */}}
  function run<T>(operation:HomepageTimingOperation,work:()=>T):T {
    if(!allowed.has(operation))return work();
    const span=++sequence,start=clock();
    emit({component:'homepage_server_timing',requestId,span,operation,phase:'start',atMs:Math.round((start-origin)*100)/100});
    const end=(outcome:'resolved'|'rejected')=>{const now=clock();emit({component:'homepage_server_timing',requestId,span,operation,phase:'end',atMs:Math.round((now-origin)*100)/100,durationMs:Math.round((now-start)*100)/100,outcome});};
    try {
      const value=work();
      if(value!==null&&(typeof value==='object'||typeof value==='function')&&typeof (value as {then?:unknown}).then==='function') {
        return Promise.resolve(value).then(result=>{end('resolved');return result;},error=>{end('rejected');throw error;}) as T;
      }
      end('resolved');return value;
    }catch(error){end('rejected');throw error;}
  }
  return {run};
}
// React request memoization, not shared process/global state. No cookie/header read.
const requestSession=cache(()=>createHomepageTimingSession(event=>console.info(JSON.stringify(event))));
export function timeHomepage<T>(operation:HomepageTimingOperation,work:()=>T):T {
  if(!homepageTimingEnabled())return work();
  return requestSession().run(operation,work);
}
export function timedHomepage<Args extends unknown[],Result>(operation:HomepageTimingOperation,work:(...args:Args)=>Result) {
  return (...args:Args):Result=>timeHomepage(operation,()=>work(...args));
}
