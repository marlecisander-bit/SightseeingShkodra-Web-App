import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,c,next){
 if(specifier==='./calendar-actions')return {url:'data:text/javascript,'+encodeURIComponent('export const saveCalendar=(...args)=>globalThis.calendarSave(...args);export const savePassengerPricing=async()=>({saved:true});'),shortCircuit:true};
 if(specifier==='next/navigation')return {url:'data:text/javascript,export const useRouter=()=>globalThis.calendarRouter;',shortCircuit:true};
 return next(specifier,c);
},load(url,c,next){
 if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};
 if(url.endsWith('.module.css'))return {format:'module',source:'export default new Proxy({}, {get:(_,key)=>key})',shortCircuit:true};
 if(url.endsWith('/calendar-actions.ts'))return {format:'module',source:'export const saveCalendar=(...args)=>globalThis.calendarSave(...args); export const savePassengerPricing=async()=>({saved:true});',shortCircuit:true};
 if(url.includes('/next/')&&url.endsWith('/navigation.js'))return {format:'module',source:'export const useRouter=()=>globalThis.calendarRouter;',shortCircuit:true};
 return next(url,c);
}});
test('calendar review, reservation confirmation, reopening and discard preserve saved prices and scope',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/admin/test/departures?view=calendar&date=2026-11-08&schedule=service'}),saved=new Map();
 for(const name of ['window','self','document','navigator','location','HTMLElement','HTMLInputElement','Node','Event','requestAnimationFrame','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:name==='requestAnimationFrame'?fn=>fn():dom.window[name]});}
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const calls=[],routes=[];globalThis.calendarRouter={push:url=>routes.push(url),refresh:()=>{}};
 globalThis.calendarSave=async(...args)=>{calls.push(structuredClone(args));return calls.length===1?{error:'Reserved passengers affected',confirmClosure:true}:{saved:true};};
 const {OperationsCalendar}=await import('../../src/app/admin/operations-calendar.tsx');
 const {OperatingCalendarWorkspace}=await import('../../src/app/admin/operating-calendar-workspace.tsx');
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
 const settings={prices:{adult:1700},offer:{name:'Winter',label:'Winter',type:'percent',values:{adult:10}},departures:{'09:00':{prices:{adult:1600}}}};
 const schedule={id:'service',product_id:'ticket',start_date:'2026-01-01',end_date:'2027-12-31',weekdays:[1,2,3,4,5,6,7],departure_times:[{time:'09:00'},{time:'11:00'}],status:'active',default_capacity:8,vehicle_id:null,updated_at:'stamp'};
 const slot=time=>({time,open:true,capacity:8,booked:2,held:1,remaining:5,quote:{total:1700,lines:[]}});
 const days=[{date:'2026-11-08',slots:[slot('09:00'),slot('11:00')],range:null,exception:{closed:false,calendar_settings:settings,departure_times:schedule.departure_times}},{date:'2026-11-09',slots:[slot('09:00')],range:null,exception:null}];
 const settle=async fn=>act(async()=>{fn();await new Promise(r=>setTimeout(r,0));});
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try{
  await settle(()=>root.render(React.createElement(OperationsCalendar,{operatorId:'test',schedule,days,month:'2026-11-01',today:'2026-11-07',initialDate:'2026-11-08'})));
  assert.equal(document.querySelectorAll('.departureCard').length,2);assert.doesNotMatch(document.body.textContent,/New departure time|Add Departure|Special prices & offers/);assert.equal(document.querySelectorAll('.occupancyRow').length,0);
  assert.equal(document.querySelector('input[data-confirmation]')?.checked,false);
  await settle(()=>button('Close sales for this date').click());assert.equal(calls.length,0);
  await settle(()=>assert.equal(window.dispatchEvent(new Event('admin:before-navigation',{cancelable:true})),false));
  await settle(()=>button('Review changes').click());assert.match(document.querySelector('[aria-label="Review calendar changes"]').textContent,/Close sales/);assert.equal(calls.length,0);
  await settle(()=>button('Save changes for 2026-11-08').click());assert.equal(calls.length,1);assert.equal(calls[0][3].settings.closed,true);assert.equal(calls[0][3].confirmed,false);
  const confirm=[...document.querySelectorAll('input')].find(i=>i.parentElement.textContent.includes('I confirm closing'));
  await settle(()=>confirm.click());await settle(()=>button('Save changes for 2026-11-08').click());assert.equal(calls[1][3].confirmed,true);assert.equal(calls[1][3].settings.prices,undefined);
  await settle(()=>button('Open sales for this date').click());await settle(()=>button('Review changes').click());await settle(()=>button('Save changes for 2026-11-08').click());
  assert.equal(calls[2][3].settings.closed,false);assert.equal(calls[2][3].settings.offer,undefined);assert.equal(calls[2][3].settings.departures['09:00'].prices,undefined);assert.equal(calls[2][3].restore,false);
  await settle(()=>button('Close sales for this date').click());await settle(()=>button('Discard changes').click());assert.equal(window.dispatchEvent(new Event('admin:before-navigation',{cancelable:true})),true);
  await settle(()=>document.querySelector('[aria-label="Next month"]').click());assert.match(routes.at(-1),/schedule=service/);
  await settle(()=>root.render(React.createElement(OperatingCalendarWorkspace,{operatorId:'test',calendars:[{schedule,title:'Daily Ticket',days},{schedule:{...schedule,id:'second',product_id:'second'},title:'Panorama',days}],products:[{id:'ticket',title:'Daily Ticket',active:false,availability_presentation:{state:'seasonal_break'},inventory_product_id:null}],selectedDate:'2026-11-08',month:'2026-11-01',today:'2026-11-07',timeZone:'Europe/Tirane',canPrice:true})));
  assert.equal(document.querySelectorAll('[aria-label="Monthly availability"]').length,1);assert.match(document.querySelector('.salesNotice').textContent,/Product sales paused — Seasonal break/);assert.equal(document.querySelectorAll('.departureCard').length,0);
 }finally{await settle(()=>root.unmount());dom.window.close();delete globalThis.calendarSave;delete globalThis.calendarRouter;for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
