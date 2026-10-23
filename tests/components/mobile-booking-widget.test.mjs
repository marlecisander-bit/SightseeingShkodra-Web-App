import {registerHooks,createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
registerHooks({load(url,c,next){
 if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};
 if(url.endsWith('/use-availability.ts'))return {format:'module',source:`export function useAvailability(){return globalThis.widgetAvailability} export const displayMoney=(v)=>String(v);`,shortCircuit:true};
 return next(url,c);
}});
const require=createRequire(import.meta.url);const availabilityPath=require.resolve('../../src/components/public/use-availability.ts');require(availabilityPath);require.cache[availabilityPath].exports={useAvailability:()=>globalThis.widgetAvailability,displayMoney:v=>String(v)};
const {BookingProvider,useBooking}=await import('../../src/components/public/booking.tsx');
const {HeroBookingWidget}=await import('../../src/components/public/hero-booking-widget.tsx');
const fixture=()=>({loading:false,error:undefined,refresh(){},quote:undefined});
async function harness(run){
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});const saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','HTMLDialogElement','Node','Event','MouseEvent','KeyboardEvent','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 window.scrollTo=()=>{};window.HTMLDialogElement.prototype.showModal=function(){this.open=true};window.HTMLDialogElement.prototype.close=function(){this.open=false};
 globalThis.widgetAvailability=fixture();let state;
 function Observe(){state=useBooking();return null;}
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
 const render=()=>act(()=>root.render(React.createElement(BookingProvider,{preview:true},React.createElement(Observe),React.createElement(HeroBookingWidget,{productTitle:'CMS product',bookingLabel:'Saved CTA',fare:{amount:2375,currency:'EUR',date:'2030-10-30'}}))));
 await render();try{await run({root,render,state:()=>state,click:async(selector)=>act(()=>document.querySelector(selector).click())});}finally{await act(()=>root.unmount());dom.window.close();delete globalThis.widgetAvailability;for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
}
test('mobile fare uses authoritative unit prices and hides stale values during loading or errors',async()=>harness(async({render,state})=>{
 assert.match(document.body.textContent,/23\.75/);assert.equal(document.querySelectorAll('form button[type="submit"]').length,1);
 await act(()=>state().setSelection(s=>({...s,date:'2030-10-31'})));
 globalThis.widgetAvailability={...fixture(),quote:{currency:'EUR',departures:[{available:true,passengerQuote:{lines:[{category:'adult',quantity:1,unitPrice:1800}]}},{available:false,passengerQuote:{lines:[{category:'adult',quantity:1,unitPrice:500}]}}]}};
 await render();assert.match(document.body.textContent,/€18/);assert.doesNotMatch(document.body.textContent,/23\.75/);
 globalThis.widgetAvailability={...fixture(),loading:true};await render();assert.match(document.body.textContent,/Checking price/);assert.doesNotMatch(document.body.textContent,/€18/);assert.equal(document.querySelector('button[type="submit"]').disabled,true);
 globalThis.widgetAvailability={...fixture(),error:'Synthetic pricing unavailable'};await render();assert.match(document.body.textContent,/Synthetic pricing unavailable/);assert.doesNotMatch(document.body.textContent,/23\.75/);
}));
test('existing adult child infant controls, dismissal and selected values survive opening checkout',async()=>harness(async({click,state})=>{
 await click('[aria-label="Add one adult"]');await click('[aria-label="Add one child"]');await click('[aria-label="Add one infant"]');
 assert.deepEqual(state().selection.passengers,{adult:2,child:1,infant:1});
 const input=document.querySelector('input[type="date"]');await act(()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'2030-11-01');input.dispatchEvent(new window.Event('input',{bubbles:true}));});assert.equal(state().selection.date,'2030-11-01');
 const panel=document.querySelector('details');panel.open=true;await act(()=>panel.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(panel.open,false);assert.equal(document.activeElement,panel.querySelector('summary'));
 await act(()=>state().setSelection(s=>({...s,date:'2030-11-01',departureId:'old'})));
 await click('button[type="submit"]');assert.equal(document.querySelector('dialog').open,true);assert.equal(state().selection.date,'2030-11-01');assert.deepEqual(state().selection.passengers,{adult:2,child:1,infant:1});
}));
