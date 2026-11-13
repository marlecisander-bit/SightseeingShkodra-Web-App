import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {HomepageJourneyProvider,useHomepageJourney,HomepageJourney}=await import('../../src/components/public/homepage-journey.tsx');
const {publicMapBinding}=await import('../../src/modules/tracking/public-map-binding.ts');

test('homepage owns one deferred validated source near the visible route, reconnects and cleans up',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),saved=new Map();
 for(const name of ['window','self','document','navigator','HTMLElement','HTMLIFrameElement','Node','Event','MessageEvent','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 let routeTop=900;window.HTMLElement.prototype.getBoundingClientRect=function(){return {top:this.id==='route'?routeTop:0};};
 let intersect,disconnected=0;
 window.IntersectionObserver=globalThis.IntersectionObserver=class {constructor(callback){intersect=callback;}observe(target){assert.equal(target.id,'route');}disconnect(){disconnected++;}};
 let mobile=false,mediaChange;window.matchMedia=()=>({matches:mobile,addEventListener(_,fn){mediaChange=fn;},removeEventListener(){}});
 const listeners={message:new Set(),online:new Set(),scroll:new Set()},add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);
 window.addEventListener=(type,fn,...rest)=>{listeners[type]?.add(fn);return add(type,fn,...rest);};window.removeEventListener=(type,fn,...rest)=>{listeners[type]?.delete(fn);return remove(type,fn,...rest);};
 let state;function Observe(){state=useHomepageJourney();return React.createElement('section',{id:'route'},React.createElement(HomepageJourney,{stops:[{id:'1',label:'Published stop'}],places:[]}));}
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 const render=enabled=>act(()=>root.render(React.createElement(HomepageJourneyProvider,{enabled},React.createElement(Observe))));
 const packet=(overrides={})=>({type:'shkodra:journey',version:1,unavailable:false,stops:[{id:'1',label:'Published stop',state:'current',eta:''}],phase:'EN_ROUTE',presentationKind:'fresh',movement:'Travelling to the lake',confidence:{position:'live'},lastObservationAt:new Date().toISOString(),statusValidUntil:new Date(Date.now()+10000).toISOString(),embeddedDisplay:{version:1,label:'LIVE',destination:'Lake',activity:'Travelling',eta:'',nextStop:'',live:true,stops:[]},...overrides});
 const emit=async(data,options={})=>act(()=>window.dispatchEvent(new window.MessageEvent('message',{data,origin:publicMapBinding.origin,source:document.querySelector('iframe').contentWindow,...options})));
 try{
  await render(true);assert.equal(document.querySelectorAll('iframe').length,0);assert.equal(listeners.message.size,0);assert.equal(listeners.online.size,0);await act(()=>intersect([{isIntersecting:true}]));assert.equal(document.querySelectorAll('iframe').length,0);assert.equal(listeners.scroll.size,1);await act(()=>window.dispatchEvent(new window.Event('scroll')));routeTop=0;assert.equal(listeners.scroll.size,0);assert.ok(disconnected>0);assert.equal(document.querySelectorAll('iframe').length,1);assert.equal(listeners.message.size,1);assert.equal(listeners.online.size,1);assert.equal(state.journey,null);
  const frame=document.querySelector('iframe'),container=frame.closest('[data-journey-source]');assert.ok(container);assert.ok(container.hasAttribute('inert'));assert.equal(container.getAttribute('aria-hidden'),'true');assert.equal(frame.getAttribute('loading'),'eager');assert.equal(frame.tabIndex,-1);assert.match(frame.src,/websiteStatus=external-v1/);assert.equal(container.querySelectorAll('button,a').length,0);
  const sent=[];frame.contentWindow.postMessage=(...args)=>sent.push(args);await act(()=>frame.dispatchEvent(new window.Event('load')));assert.deepEqual(sent.at(-1),[{type:'shkodra:request-journey',version:1,embeddedDisplayVersion:1},publicMapBinding.origin]);
  await emit(packet(),{origin:'https://attacker.invalid'});await emit(packet(),{source:window});await emit(packet({version:2}));await emit(packet({embeddedDisplay:{version:99}}));assert.equal(state.journey,null);
  await emit(packet());assert.equal(state.journey.movement,'Travelling to the lake');assert.ok(document.querySelector('[data-live=true]'));
  const historic=packet({phase:'UNKNOWN',presentationKind:'historical_location',movement:'Last reported near the lake',confidence:{position:'delayed'},lastObservationAt:new Date(Date.now()-120000).toISOString(),statusValidUntil:new Date(Date.now()+20000).toISOString()});
  await emit(historic);assert.equal(state.stale,false);assert.equal(state.journey.movement,historic.movement);assert.match(document.querySelector('[aria-label="Live journey status"]').textContent,/Last reported near the lake/);assert.equal(document.querySelector('[data-live=true]'),null);
  await emit(packet({statusValidUntil:new Date(Date.now()+100).toISOString()}));await act(()=>new Promise(r=>setTimeout(r,150)));assert.equal(state.journey,null);assert.equal(state.stale,true);assert.match(document.querySelector('[aria-label="Live journey status"]').textContent,/Live connection interrupted/);
  await emit(packet());assert.equal(state.stale,false);assert.ok(state.journey);
  await act(()=>{mobile=true;mediaChange?.();});assert.ok(document.querySelector('[aria-label="Live journey status"]'));assert.equal(document.querySelectorAll('iframe').length,1);assert.ok(document.querySelector('[aria-label="Choose a destination"]'));
  const previous=frame.contentWindow;await act(()=>window.dispatchEvent(new window.Event('online')));assert.equal(state.journey,null);assert.equal(state.stale,false);assert.equal(document.querySelectorAll('iframe').length,1);assert.notEqual(document.querySelector('iframe').contentWindow,previous);assert.equal(listeners.message.size,1);
  await emit(packet(),{source:previous});assert.equal(state.journey,null);await emit(packet());assert.ok(state.journey);
  await render(false);assert.equal(state.journey,null);assert.equal(document.querySelectorAll('iframe').length,0);assert.equal(listeners.message.size,0);assert.equal(listeners.online.size,0);
  await render(true);assert.equal(document.querySelectorAll('iframe').length,0);await act(()=>intersect([{isIntersecting:true}]));assert.equal(document.querySelectorAll('iframe').length,1);assert.equal(listeners.message.size,1);
 }finally{await act(()=>root.unmount());assert.equal(listeners.message.size,0);assert.equal(listeners.online.size,0);delete globalThis.IntersectionObserver;dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
