import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
registerHooks({resolve(specifier,c,next){
 if(specifier==='./product-booking-actions')return {url:'data:text/javascript,export async function saveProductBooking(){throw Error("No writes in renderer");}',shortCircuit:true};
 return next(specifier,c);
},load(url,c,next){if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {ProductBookingCards}=await import('../../src/components/public/product-booking-cards.tsx');
const {ProductBookingSettings}=await import('../../src/app/admin/product-booking-settings.tsx');
const source={id:'10000000-0000-4000-8000-000000000001',title:'Hop On Hop Off'};
const loop={id:'10000000-0000-4000-8000-000000000002',title:'Sightseeing Loop Tour',slug:'loop',mode:'selected_departure',minutes:120,card:{image:'/images/lake.webp',alt:'Lake',description:'Published loop description',enabled:true,order:1}};
test('published cards reuse accessible date/passenger/checkout controls and distinguish reservation periods',()=>{
 const html=renderToStaticMarkup(React.createElement(ProductBookingCards,{products:[loop,{...loop,id:source.id,title:'Whole-day ticket',mode:'whole_day'}],content:initialWebsiteContent,preview:true}));
 const dom=new JSDOM(html);const document=dom.window.document;
 assert.equal(document.querySelectorAll('article').length,2);
 assert.equal(document.querySelectorAll('input[type="date"]').length,2);
 assert.equal(document.querySelectorAll('button[type="submit"]').length,2);
 assert.match(document.body.textContent,/Sightseeing Loop Tour/);assert.match(document.body.textContent,/selected departure · 2 hours/);assert.match(document.body.textContent,/all operating day/);
 assert.equal(document.querySelectorAll('dialog').length,2);
 assert.doesNotMatch(document.body.textContent,/€\d/,'no invented price before a domain quote');dom.window.close();
});
test('disabled cards are absent; reservation settings expose shared inventory without creating another schedule',()=>{
 assert.equal(renderToStaticMarkup(React.createElement(ProductBookingCards,{products:[{...loop,card:{...loop.card,enabled:false}}],content:initialWebsiteContent})), '');
 const html=renderToStaticMarkup(React.createElement(ProductBookingSettings,{operatorId:source.id,product:{...loop,updated_at:'2030-01-01',inventory_product_id:source.id,seat_reservation_mode:'selected_departure',reservation_minutes:120},sources:[source]}));
 const dom=new JSDOM(html);const document=dom.window.document;
 assert.equal(document.querySelector('select[name="inventory_product_id"]').value,source.id);
 assert.equal(document.querySelector('input[name="reservation_minutes"]').value,'120');
 assert.deepEqual([...document.querySelectorAll('select[name="seat_reservation_mode"] option')].map(o=>o.value),['selected_departure','whole_day']);
 assert.match(document.body.textContent,/new reservations only/);dom.window.close();
});
test('product contexts isolate selection, inherit meeting-point settings and use distinct accessible dialog titles',async()=>{
 const {act}=await import('react');const {BookingProvider,useBooking}=await import('../../src/components/public/booking.tsx');
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});const saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','HTMLDialogElement','Node','Event','sessionStorage','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 window.scrollTo=()=>{};window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
 const contexts=new Map();function Observe({id}){contexts.set(id,useBooking());return null;}
 const point={name:'Configured boarding point',directions:'Synthetic fixture',url:'https://maps.app.goo.gl/test',label:'Find boarding point',stopId:null};
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
 try{
  await act(()=>root.render(React.createElement(BookingProvider,{preview:true,currentMeetingPoint:point},React.createElement(BookingProvider,{preview:true,product:loop},React.createElement(Observe,{id:'loop'})),React.createElement(BookingProvider,{preview:true,product:{...loop,id:source.id}},React.createElement(Observe,{id:'other'})))));
  await act(()=>contexts.get('loop').setSelection(s=>({...s,date:'2030-06-01',guests:2,departureId:'synthetic'})));
  assert.equal(contexts.get('loop').selection.productId,loop.id);assert.equal(contexts.get('other').selection.productId,source.id);assert.equal(contexts.get('other').selection.date,'');assert.deepEqual(contexts.get('loop').currentMeetingPoint,point);
  sessionStorage.setItem('shkodra-checkout-v1:'+loop.id,'loop');sessionStorage.setItem('shkodra-checkout-v1:'+source.id,'other');sessionStorage.setItem('shkodra-checkout-v1','primary');
  await act(()=>contexts.get('loop').reset());assert.equal(sessionStorage.getItem('shkodra-checkout-v1:'+loop.id),null);assert.equal(sessionStorage.getItem('shkodra-checkout-v1:'+source.id),'other');assert.equal(sessionStorage.getItem('shkodra-checkout-v1'),'primary');
  await act(()=>{contexts.get('loop').open();contexts.get('other').open();});const dialogs=[...document.querySelectorAll('dialog[open]')];assert.equal(dialogs.length,2);
  const ids=dialogs.map(d=>d.getAttribute('aria-labelledby'));assert.equal(new Set(ids).size,2);for(const dialog of dialogs)assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')),dialog.querySelector('h2'));
 }finally{await act(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
