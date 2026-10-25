import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {LiveJourneyTracker}=await import('../../src/components/public/live-journey-tracker.tsx');
test('manual browsing survives journey advances; follow restores centering and stale data removes claims',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 const saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','Element','Event','Node','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 dom.window.matchMedia=()=>({matches:true});
 const scrolls=[];dom.window.HTMLElement.prototype.scrollTo=function(options){scrolls.push(options);};
 Object.defineProperty(dom.window.HTMLElement.prototype,'scrollWidth',{configurable:true,get(){return this.tagName==='OL'?1000:0;}});
 Object.defineProperty(dom.window.HTMLElement.prototype,'clientWidth',{configurable:true,get(){return 300;}});
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.querySelector('#root'));
 const stops=Array.from({length:5},(_,i)=>({id:String(i),label:`Stop ${i+1}`}));
 const snapshot=index=>({type:'shkodra:journey',version:1,unavailable:false,stops:stops.map((s,i)=>({...s,state:i===index?'current':i<index?'departed':'upcoming',eta:''}))});
 const render=async(index,stale=false)=>act(async()=>root.render(React.createElement(LiveJourneyTracker,{stops,places:[],journey:snapshot(index),stale})));
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try{
  await render(1);assert.equal(scrolls.length,1);
  await act(async()=>document.querySelector('[aria-label="Browse stop 5: Stop 5"]').click());
  assert.ok(button('Follow van'));const count=scrolls.length;
  await render(2);assert.equal(scrolls.length,count,'live advance cannot interrupt browsing');
  await act(async()=>button('Follow van').click());assert.ok(scrolls.length>count);assert.ok(!button('Follow van'));
  const following=scrolls.length;await render(3);assert.equal(scrolls.length,following+1);
  await render(3,true);assert.ok(!document.querySelector('[data-state="current"]'));assert.match(document.body.textContent,/stale/);
  await render(0);assert.ok(!document.querySelector('[data-state="departed"]'),'upstream loop reset discards old completion');
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
});
