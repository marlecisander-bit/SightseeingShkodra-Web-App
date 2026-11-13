import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {EmbeddedMapStatus}=await import('../../src/components/public/embedded-map-status.tsx');
const render=props=>renderToStaticMarkup(React.createElement(EmbeddedMapStatus,{reason:'loading',unavailable:false,onStop:()=>{},...props}));
const display={version:1,label:'Arriving',destination:'Castle <fixture>',activity:'',eta:'Arrival in 8 min',nextStop:'Castle',live:true,stops:[{id:'1',number:'1',name:'Lake',label:'Passed',state:'completed',checked:true},{id:'2',number:'2',name:'Castle',label:'Arriving',state:'approaching'},{id:'3',number:'3',name:'Centre',label:'Upcoming',state:'upcoming'}]};
const fresh=()=>({type:'shkodra:journey',version:1,unavailable:false,movement:'Arriving at Castle',phase:'ARRIVING',presentationKind:'fresh',lastObservationAt:new Date(Date.now()-10000).toISOString(),statusValidUntil:new Date(Date.now()+60000).toISOString(),confidence:{position:'live',eta:'valid'},stops:[]});
test('loading and disconnected panels keep configured stops without live progress or invented ETA',()=>{
 for(const props of [{},{reason:'stale'},{unavailable:true}]){const html=render({...props,configuredStops:[{id:'x',label:'Configured stop'}]});assert.match(html,/Van journey information/);assert.match(html,/Waiting for a current update/);assert.match(html,/ETA unavailable/);assert.match(html,/View 1 stops/);assert(!html.includes('aria-current'));assert(!html.includes('aria-live'));}
});
test('fresh authoritative arrival and explicit passed evidence render accessible names, count and commands',()=>{
 const html=render({display,snapshot:fresh()});assert.match(html,/Castle &lt;fixture&gt;/);assert.match(html,/Arrival in 8 min/);assert.match(html,/LIVE/);assert.match(html,/Updated 10s ago/);assert.match(html,/Next destination/);assert.match(html,/View 3 stops/);assert.equal((html.match(/aria-current="step"/g)||[]).length,1);assert.equal((html.match(/type="button"/g)||[]).length,4);assert.match(html,/Confirmed passed/);assert.match(html,/Upcoming/);assert(!html.includes('<small>Upcoming</small>'));
});
test('historical or expired positions cannot expose a live badge, active next destination or ETA',()=>{
 for(const snapshot of [{...fresh(),phase:'UNKNOWN',presentationKind:'historical_stopped',confidence:{position:'delayed',eta:'valid'}},{...fresh(),statusValidUntil:new Date(Date.now()-1000).toISOString()}]){
 const html=render({display:{...display,live:false,destination:'Last seen at Castle'},snapshot});assert(!html.includes('LIVE'));assert(!html.includes('Arrival in 8 min'));assert.match(html,/ETA unavailable/);assert.match(html,/Next on route/);assert(!html.includes('aria-current'));assert(!html.includes('aria-live'));
 }
});
test('route order alone never marks an earlier stop passed; stationary next-on-route is not active destination',()=>{
 const html=render({display:{...display,stops:display.stops.map(s=>({...s,checked:false,state:'upcoming'}))},snapshot:{...fresh(),phase:'PARKED'}});assert(!html.includes('Confirmed passed'));assert.match(html,/Next on route/);assert(!html.includes('Next destination'));
});
test('unavailable GPS and closed service preserve upstream copy and cannot claim current tracking',()=>{
 for(const destination of ['Location unavailable','Tours have finished for today']){const html=render({display:{...display,destination,live:false},snapshot:{...fresh(),phase:'UNKNOWN',presentationKind:'unavailable',confidence:{position:'unavailable',eta:'unavailable'}}});assert(html.includes(destination));assert.match(html,/Tracking unavailable/);assert(!html.includes('LIVE'));assert(!html.includes('Arrival in 8 min'));}
});
test('external panel gate preserves canonical iframe, handshake opt-in and map controls',async()=>{
 const {LiveMapEmbed}=await import('../../src/components/public/live-map-embed.tsx');const {websiteExternalStatusEnabled}=await import('../../src/modules/tracking/public-map-binding.ts');const html=renderToStaticMarkup(React.createElement(LiveMapEmbed,{presentation:'full'}));assert.equal(html.includes('websiteStatus='),websiteExternalStatusEnabled);assert.equal(html.includes('Van journey information'),websiteExternalStatusEnabled);assert(html.includes('allow="geolocation"'));assert(html.includes('Interact with map'));assert(html.includes('Reload map'));assert(html.includes('embed=1'));if(process.env.NODE_ENV!=='development')assert(!html.includes('127.0.0.1'));
});
test('missing live stop projection retains the actual configured route count',()=>{
 const configuredStops=Array.from({length:7},(_,i)=>({id:String(i),label:'Configured destination '+i}));
 const html=render({display:{...display,live:false,stops:[]},configuredStops});assert.match(html,/View 7 stops/);assert.equal((html.match(/type="button"/g)||[]).length,8);assert(!html.includes('Confirmed passed'));
});

test('stale transport cannot claim LIVE even when a retained snapshot has not expired',()=>{
 const html=render({display,snapshot:fresh(),reason:'stale'});assert(!html.includes('● LIVE'));assert.match(html,/Last known stop/);assert.match(html,/Next on route/);assert.match(html,/ETA unavailable/);assert(!html.includes('aria-current'));assert(!html.includes('Arrival in 8 min'));
});
test('panel uses the exact Find Van SVG asset and keeps one visible name per stop',async()=>{
 const {readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');
 const asset=await readFile(new URL('../../public/brand/map-bus-front.svg',import.meta.url));assert.equal(createHash('sha256').update(asset).digest('hex'),JSON.parse(await readFile(new URL('../../docs/evidence/route-compact-20261113/icon-provenance.json',import.meta.url),'utf8')).sha256);
 const css=await readFile(new URL('../../src/components/public/embedded-map-status.module.css',import.meta.url),'utf8');assert(css.includes("url('/brand/map-bus-front.svg')"));
 const html=render({display,snapshot:fresh()});assert.equal((html.match(/<strong>Castle<\/strong>/g)||[]).length,2);assert(!html.includes('<small>Upcoming</small>'));assert.match(html,/Tracking details/);
});

test('delayed reported-stop copy stays last known when no timeline stop is marked current',()=>{
 const html=render({display:{...display,live:false,destination:'At stop: Start/Stop',stops:display.stops.map(s=>({...s,state:'unknown',checked:false}))},snapshot:{...fresh(),presentationKind:'reported_stopped',confidence:{position:'delayed',eta:'unavailable'}}});assert.match(html,/Last known stop/);assert.match(html,/<h2>Start\/Stop<\/h2>/);assert(!html.includes('● LIVE'));assert.match(html,/ETA unavailable/);
});
