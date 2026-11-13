import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {LiveJourneyTracker}=await import('../../src/components/public/live-journey-tracker.tsx');
const stops=Array.from({length:5},(_,i)=>({id:`stop-${i}`,label:`Published stop ${i+1}`}));
const places=[{id:'lake',stopId:'stop-1',name:'CMS lake',text:'CMS description',image:'/images/lake.webp',alt:'CMS alt',link:'/explore/lake'}];
const journey={type:'shkodra:journey',version:1,unavailable:false,stops:stops.map((s,i)=>({...s,state:i===0?'departed':i===1?'next':'upcoming',eta:i===1?'14 min':''}))};
const render=props=>renderToStaticMarkup(React.createElement(LiveJourneyTracker,{stops,places,journey,...props}));
test('tracker renders five CMS-backed destinations and uses authoritative ETA only once',()=>{const html=render();assert.equal((html.match(/aria-pressed="false"/g)||[]).length,4);assert.ok(html.includes('CMS lake'));assert.ok(!html.includes('CMS description'),'unselected descriptions are not repeated');assert.ok(html.includes('CMS alt'));assert.ok(html.includes('Next stop: 2 of 5'));assert.equal((html.match(/14 min/g)||[]).length,1);assert.ok(html.includes('Departure confirmed'));assert.ok(!html.includes('<iframe'));});
test('stale and unavailable snapshots remove progress, van-position and ETA claims',()=>{for(const props of [{stale:true},{journey:{...journey,unavailable:true}},{journey:null}]){const html=render(props);assert.ok(!html.includes('14 min'));assert.ok(!html.includes('data-state="departed"'));assert.ok(!html.includes('data-state="next"'));assert.ok(!html.includes('Van here'));assert.ok(html.includes('CMS lake'));}});
test('arrival suppresses ETA and loop reset never preserves previous completion',()=>{const arrived={...journey,stops:journey.stops.map((s,i)=>({...s,state:i===0?'current':i===1?'next':'upcoming'}))};const html=render({journey:arrived});assert.ok(html.includes('Van at Published stop 1'));assert.ok(!html.includes('14 min'));assert.ok(!html.includes('data-state="departed"'));assert.ok(html.includes('Van here'));});
test('an unvisited stop stays neutral even when a later stop becomes next',()=>{const skipped={...journey,stops:journey.stops.map((s,i)=>({...s,state:i===0?'departed':i===4?'next':'upcoming',eta:''}))};const html=render({journey:skipped});assert.equal((html.match(/data-state="departed"/g)||[]).length,1);assert.ok(html.includes('Next stop: 5 of 5'));assert.ok(!html.includes('Heading to'));assert.ok(!html.includes('minutes'));});

test('every recognized arrival and multiple confirmed departures remain authoritative',()=>{
 for(let target=0;target<5;target++){
  const snapshot={...journey,stops:stops.map((s,i)=>({...s,state:i===target?'current':i<target?'departed':'upcoming',eta:''}))};
  const html=render({journey:snapshot});
  assert.equal((html.match(/data-state="departed"/g)||[]).length,target);
  assert.ok(html.includes(`Van at ${target===1?'CMS lake':stops[target].label}`));
  assert.equal((html.match(/data-state="current"/g)||[]).length,1);
 }
});

test('Route page can keep editorial destinations without a duplicate status summary',()=>{const html=render({showStatus:false});assert(!html.includes('aria-label="Live journey status"'));assert.match(html,/CMS lake/);assert.match(html,/Choose a destination/);});


test('historical or old GPS never illuminates LIVE even when transport is connected',()=>{
 const now=Date.now();const live={...journey,phase:'EN_ROUTE',presentationKind:'fresh',movement:'Travelling',confidence:{position:'live'},lastObservationAt:new Date(now-1000).toISOString(),statusValidUntil:new Date(now+10000).toISOString()};
 assert.match(render({journey:live}),/data-live="true"/);
 for(const value of [{...live,phase:'UNKNOWN',presentationKind:'historical_location',confidence:{position:'delayed'}},{...live,lastObservationAt:new Date(now-100000).toISOString()},{...live,statusValidUntil:new Date(now-1).toISOString()},{...live,phase:'UNKNOWN'}])assert.doesNotMatch(render({journey:value}),/data-live="true"/);
});

test('homepage cards start neutral, preserve editorial images and copy, and keep historical tracking honest',()=>{
 const html=render({cards:true,journey:{...journey,movement:'Last reported near CMS lake'}});
 assert(!html.includes('aria-pressed="true"'));assert(!html.includes('aria-expanded="true"'));
 assert.match(html,/Your journey starts here/);assert.match(html,/Lakeside views/);assert.match(html,/CMS alt/);
 assert(!html.includes('CMS description'));assert(!html.includes('14 min'));assert.match(html,/ETA unavailable/);
 assert(!html.includes('data-live="true"'));assert(!html.includes('Van here'));
 const historic=render({cards:true,journey:{...journey,stops:journey.stops.map((s,i)=>({...s,state:i===1?'current':'upcoming'})),movement:'Last reported near CMS lake'}});
 assert.match(historic,/Last known stop/);assert.match(historic,/Next on route/);assert(!historic.includes('data-state="current"'));
});
