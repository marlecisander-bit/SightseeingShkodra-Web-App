import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
// Imported after render.mjs installs the existing CSS test adapter.
const {BookingProvider,BookButton}=await import('../../src/components/public/booking.tsx');
const {RouteJourney}=await import('../../src/components/public/route-journey.tsx');
const {HomepageView}=await import('../../src/components/public/homepage-view.tsx');
const {planner,place,homeData}=await import('./render.mjs');
export const clientKeys=new Set(['labels.destination','routePage.mapAction','bookingDialog.title','bookingDialog.text']);
export async function renderClientProbe(key,content){
 const dom=new JSDOM('<!doctype html><html><body><div id="fixture"></div></body></html>',{url:'http://127.0.0.1',pretendToBeVisual:true});
 // Default jsdom does not execute scripts or load subresources. No hosted APIs/iframes are fetched.
 const saved=new Map();for(const name of ['window','self','document','navigator','HTMLElement','HTMLDialogElement','Element','Node','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 dom.window.scrollTo=()=>{};dom.window.matchMedia=query=>({matches:key==='labels.destination'&&query==='(max-width: 759px)',addEventListener(){},removeEventListener(){}});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new dom.window.Event('close'));};
 const host=dom.window.document.getElementById('fixture');const {createRoot}=await import('react-dom/client');const root=createRoot(host);
 try{
  const component=key==='labels.destination'?React.createElement(BookingProvider,{content,preview:true},React.createElement(HomepageView,{preview:true,home:homeData(),content,planner,places:[place]})):key==='routePage.mapAction'?React.createElement(RouteJourney,{content,initial:{date:'2030-06-01',times:[],fares:[],stops:[{id:'fixture-stop',label:'Synthetic stop'}]},places:[]}):React.createElement(BookingProvider,{content,preview:true},React.createElement(BookButton,null,'Open synthetic booking'));
  await act(async()=>{root.render(component);});
  let html;
  if(key==='labels.destination'||key==='routePage.mapAction'){
   const trigger=host.querySelector('ol[aria-label="Choose a destination"] button');assert.ok(trigger,'real stop selector missing');
   const detail=host.querySelector('[id="'+trigger.getAttribute('aria-controls')+'"]');assert.ok(detail,'persistent details missing');
   assert.equal(host.querySelector('[id="'+detail.getAttribute('aria-labelledby')+'"]'),detail.querySelector('h3'));
   await act(async()=>trigger.click());
   assert.equal(host.querySelector('[id="'+trigger.getAttribute('aria-controls')+'"]'),detail,'selection must update the same persistent card');
   assert.equal(trigger.getAttribute('aria-pressed'),'true');
   assert.ok(!detail.textContent.includes('Close details'));
   if(key==='labels.destination'){const link=detail.querySelector('a');assert.ok(link);assert.equal(link.getAttribute('href'),place.link);assert.equal(link.textContent,content[key]);}
   else assert.ok([...detail.querySelectorAll('button')].some(b=>b.textContent===content[key]),'CMS map action missing from persistent details');
   // Ignore opaque per-mount React IDs while retaining all CMS output assertions.
   html=detail.outerHTML.replace(/_r_[a-z0-9]+_/g,'fixture-react-id');
  }else{
   assert.ok(!host.querySelector('dialog[open]'));assert.ok(!host.textContent.includes(content[key]),'dialog copy must not leak before opening');
   await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Open synthetic booking').click());
   const dialog=host.querySelector('dialog[open]');assert.ok(dialog);assert.equal(host.querySelector('[id="'+dialog.getAttribute('aria-labelledby')+'"]'),dialog.querySelector('h2'));html=dialog.outerHTML;
   assert.equal(dialog.querySelector(key.endsWith('title')?'h2':'div > p')?.textContent,content[key]);
   await act(async()=>dialog.querySelector('button[aria-label="Close booking"]').click());assert.ok(!host.querySelector('dialog[open]'));
  }
  return {route:key==='labels.destination'?'/':key==='routePage.mapAction'?'/route':'shared booking dialog',consumer:key==='labels.destination'||key==='routePage.mapAction'?'actual React persistent stop card selected in isolated jsdom':'actual React booking component opened/closed in isolated jsdom',html:html.replace(/(id|aria-labelledby)="_r_[a-z0-9]+_"/g,'$1="fixture-react-id"')};
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
}
