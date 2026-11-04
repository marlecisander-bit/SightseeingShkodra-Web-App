import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {MobileBookingDate}=await import('../../src/components/public/mobile-booking-date.tsx');
const {useAvailability}=await import('../../src/components/public/use-availability.ts');
async function environment(run){const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),saved=new Map();for(const name of ['window','document','navigator','HTMLElement','HTMLDialogElement','Node','Event','MessageEvent','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close',{bubbles:true}));};const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));try{await run(root);}finally{await act(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}}
const quote=(date,guests=1)=>({version:1,date,guests,productId:'10000000-0000-4000-8000-000000000001',currency:'EUR',total:1000,departures:[{id:'open',available:true,remaining:8,startTime:'11:00'}],categories:{adult:{min:13,max:null,price:1000},child:{min:3,max:12,price:800},infant:{min:0,max:2,price:0}}});
test('inline monthly calendar validates dates before selection without opening another dialog',async()=>environment(async root=>{
 const selected=[],checks=[];
 const checkDate=async date=>{checks.push(date);return {...quote(date),departures:[{id:'sold',available:checks.length>1,remaining:checks.length>1?8:0,startTime:'11:00'}]};};
 await act(()=>root.render(React.createElement(MobileBookingDate,{value:'2030-06-01',quote:{...quote('2030-06-01'),businessDate:'2030-06-01'},checkDate,onChange:(...args)=>selected.push(args)})));
 assert.equal(checks.length,0);assert.equal(document.querySelector('dialog'),null);assert.equal(document.querySelector('[aria-haspopup=dialog]'),null);
 const cells=[...document.querySelectorAll('[aria-label="Choose booking date"] button')];assert.equal(cells.length%7,0);assert.equal(cells[0].textContent,'27');assert.equal(cells[0].disabled,true);
 const day=()=>[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')?.startsWith('Check availability:'));
 const first=day();await act(async()=>{first.click();await Promise.resolve();});assert.equal(selected.length,0);assert.equal(first.disabled,true);assert.match(document.querySelector('[role=status]').textContent,/No departures available/);
 const second=day();await act(async()=>{second.click();await Promise.resolve();});assert.equal(selected.length,1);assert.equal(selected[0][1],true);assert.equal(document.querySelector('dialog'),null);
 await act(()=>document.querySelector('[aria-label="Next month"]').click());assert.match(document.querySelector('strong').textContent,/July 2030/);assert.equal(document.querySelectorAll('[aria-label="Choose booking date"] button').length%7,0);
}));
test('calendar availability response is reused exactly once for the matching selection',async()=>environment(async root=>{
 const original=globalThis.fetch,calls=[];globalThis.fetch=async url=>{const u=new URL(url,'http://localhost');calls.push(u.searchParams);return Response.json({quote:quote(u.searchParams.get('date'),Number(u.searchParams.get('guests'))),timezone:'Europe/Tirane'});};
 let model,setDate,setGuests;function Probe(){const [date,dateSetter]=React.useState(''),[guests,guestSetter]=React.useState(1);setDate=dateSetter;setGuests=guestSetter;model=useAvailability(date,guests,undefined,0,'10000000-0000-4000-8000-000000000001');return null;}
 try{await act(()=>root.render(React.createElement(Probe)));await act(async()=>{await model.checkDate('2030-06-02',new AbortController().signal);setDate('2030-06-02');});await act(()=>new Promise(r=>setTimeout(r,300)));assert.equal(calls.length,1);assert.equal(model.quote.date,'2030-06-02');assert.equal(model.loading,false);
 await act(()=>setGuests(2));await act(()=>new Promise(r=>setTimeout(r,300)));assert.equal(calls.length,2);assert.equal(model.quote.guests,2);
 await act(async()=>{await model.checkDate('2030-06-02',new AbortController().signal);});assert.equal(calls.length,3);assert.equal(model.quote.guests,2);
 globalThis.fetch=async()=>Response.json({quote:{...quote('2030-06-03'),productId:'wrong'}});await assert.rejects(model.checkDate('2030-06-03',new AbortController().signal),/unavailable/);
 }finally{globalThis.fetch=original;}
}));
