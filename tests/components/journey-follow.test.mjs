import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {LiveJourneyTracker}=await import('../../src/components/public/live-journey-tracker.tsx');
const {HomepageJourney,HomepageJourneyProvider,useHomepageJourney}=await import('../../src/components/public/homepage-journey.tsx');
function Feed({journey,stale}){const live=useHomepageJourney();const receive=live?.receive;React.useEffect(()=>receive?.(journey,stale?'stale':undefined),[journey,stale,receive]);return null;}
test('selection survives tracking advances and expired transport; keyboard and map actions use the selected stop',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 const saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','Element','Event','Node','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 dom.window.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),addEventListener(){},removeEventListener(){}});
 const scrolls=[];dom.window.HTMLElement.prototype.scrollTo=function(options){scrolls.push(options);};
 Object.defineProperty(dom.window.HTMLElement.prototype,'scrollWidth',{configurable:true,get(){return this.tagName==='OL'?1000:0;}});
 Object.defineProperty(dom.window.HTMLElement.prototype,'clientWidth',{configurable:true,get(){return 300;}});
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.querySelector('#root'));
 const stops=Array.from({length:5},(_,i)=>({id:String(i),label:`Stop ${i+1}`}));
 const snapshot=index=>({type:'shkodra:journey',version:1,unavailable:false,stops:stops.map((s,i)=>({...s,state:i===index?'current':i<index?'departed':'upcoming',eta:''}))});
 const render=async(index,stale=false)=>act(async()=>root.render(React.createElement(LiveJourneyTracker,{stops,places:[],journey:snapshot(index),stale})));

 try{
  await render(1);assert.equal(scrolls.length,0,'tracking cannot scroll the editorial selector');
  await act(async()=>document.querySelector('[aria-label="Stop 5: Stop 5"]').click());
  assert.match(document.querySelector('section[aria-labelledby]').textContent,/Stop 5 of 5/);
  const count=scrolls.length;
  await render(2);assert.equal(scrolls.length,count,'live advance cannot interrupt browsing');
  assert.equal(document.querySelector('[aria-pressed=true]').getAttribute('aria-label'),'Stop 5: Stop 5');
  await render(3,true);assert.ok(!document.querySelector('[data-state="current"]'));assert.match(document.body.textContent,/stale/);
  assert.equal(document.querySelector('[aria-pressed=true]').getAttribute('aria-label'),'Stop 5: Stop 5');
  await act(async()=>document.querySelector('[aria-pressed=true]').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Home',bubbles:true})));
  assert.equal(document.activeElement.getAttribute('aria-label'),'Stop 1: Stop 1');
  const maps=[];await act(async()=>root.render(React.createElement(LiveJourneyTracker,{stops,places:[],journey:snapshot(2),onMap:id=>maps.push(id)})));
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='View on map').click());assert.deepEqual(maps,['0']);
  await render(0);assert.ok(!document.querySelector('[data-state="departed"]'),'upstream loop reset discards old completion');
  const scenarios=[snapshot(0),snapshot(1),snapshot(4),{...snapshot(2),stops:snapshot(2).stops.map((s,i)=>({...s,state:i===2?'next':i===0?'departed':'upcoming'}))},null];
  for(const journey of scenarios){for(const stale of [false,true]){
   await act(async()=>root.render(React.createElement(React.Fragment,null,
    React.createElement(HomepageJourneyProvider,null,React.createElement(Feed,{journey,stale}),React.createElement('div',{'data-page':'home'},React.createElement(HomepageJourney,{stops,places:[]}))),
    React.createElement('div',{'data-page':'route'},React.createElement(LiveJourneyTracker,{stops,places:[],journey,stale})))));
   await act(async()=>{await new Promise(resolve=>setTimeout(resolve,50));});
   const states=page=>[...document.querySelectorAll(`[data-page="${page}"] [data-state]`)].map(node=>node.dataset.state);
   assert.deepEqual(states('home'),states('route'),'same snapshot yields matching page states');
   assert.equal(document.querySelector('[data-page="home"] [role="status"]').textContent,document.querySelector('[data-page="route"] [role="status"]').textContent);
  }}

 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
});
