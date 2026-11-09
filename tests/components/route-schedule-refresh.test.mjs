import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {plannerClock} from '../../src/modules/content/day-planner.ts';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {RouteJourney}=await import('../../src/components/public/route-journey.tsx');
test('Route fetches current product times on entry, return from admin, and refreshed page props',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/route'}),saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','Node','Event','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
 const originalFetch=globalThis.fetch;let calls=0;
 const base={date:plannerClock().date,title:'Tour',times:['09:00'],fares:[],stops:[]};let latest={...base,times:['10:15']};
 globalThis.fetch=async url=>{assert.equal(url,'/api/public/day-planner');calls++;return Response.json(latest);};
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
 const settle=()=>new Promise(r=>setTimeout(r,20));
 const render=async initial=>act(async()=>{root.render(React.createElement(RouteJourney,{content:initialWebsiteContent,initial,places:[]}));await settle();});
 const times=()=>[...document.querySelectorAll('[aria-labelledby="journey-departures"] time')].map(t=>t.textContent);
 try{
  await render(base);await act(settle);assert.deepEqual(times(),['10:15']);assert.equal(calls,1);
  latest={...base,times:['11:30','14:00']};await act(async()=>{window.dispatchEvent(new Event('focus'));await settle();});assert.deepEqual(times(),latest.times);
  latest={...base,times:['15:45']};await render({...base,times:['12:00']});await act(settle);assert.deepEqual(times(),['15:45']);
  latest={...base,times:[]};await act(async()=>{document.dispatchEvent(new Event('visibilitychange'));await settle();});assert.deepEqual(times(),[]);assert.match(document.body.textContent,/No service today/);
 }finally{await act(()=>root.unmount());globalThis.fetch=originalFetch;dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
