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
const source={id:'10000000-0000-4000-8000-000000000001',title:'Hop On Hop Off'};
const loop={id:'10000000-0000-4000-8000-000000000002',title:'Sightseeing Loop Tour',slug:'loop',mode:'selected_departure',minutes:120,card:{image:'/images/lake.webp',alt:'Lake',description:'Published loop description',enabled:true,order:1}};
test('compact cards show photos, short facts and one product-specific booking link without selectors',()=>{
 const html=renderToStaticMarkup(React.createElement(ProductBookingCards,{products:[{...loop,adultPrice:1200,card:{...loop.card,features:['audio_guide']}},{...loop,id:source.id,title:'Whole-day ticket',mode:'whole_day',adultPrice:0}],content:initialWebsiteContent}));
 const dom=new JSDOM(html),d=dom.window.document;assert.equal(d.querySelector('section').getAttribute('aria-label'),'Book your experience');assert.equal(d.querySelector('h2').className,'p-screen-reader-only');assert.equal(d.querySelectorAll('[data-product-booking]').length,4);assert.equal(d.querySelectorAll('article').length,2);assert.equal(d.querySelectorAll('img').length,2);assert.equal(d.querySelectorAll('input,select,form,dialog,details').length,0);
 const cards=[...d.querySelectorAll('article')];assert.equal(cards[0].querySelector('h3').textContent,loop.title);assert.doesNotMatch(cards[0].textContent,/2 hours reservation/);assert.match(cards[0].textContent,/Audio guide/);assert.match(cards[0].textContent,/12.00/);assert.doesNotMatch(cards[1].textContent,/Whole-day reservation/);assert.match(cards[1].textContent,/0.00/);
 for(const [i,product]of [loop,{id:source.id}].entries()){const links=cards[i].querySelectorAll('a');assert.equal(links.length,1);assert.equal(links[0].getAttribute('href'),`/book?productId=${product.id}`);assert.equal(cards[i].querySelector('div').textContent.includes('Published loop description'),false);}
 assert.doesNotMatch(cards[1].textContent,/Audio guide/);dom.window.close();
});
test('hidden cards remain absent and private previews cannot navigate into live booking',()=>{
 assert.equal(renderToStaticMarkup(React.createElement(ProductBookingCards,{products:[{...loop,card:{...loop.card,enabled:false}}],content:initialWebsiteContent})), '');
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(ProductBookingCards,{products:[loop],content:initialWebsiteContent,preview:true})));assert.equal(dom.window.document.querySelectorAll('a').length,0);assert.equal(dom.window.document.querySelector('button').disabled,true);assert.doesNotMatch(dom.window.document.body.textContent,/Audio guide|Wi-Fi/);dom.window.close();
});
test('product contexts isolate selection, inherit meeting-point settings and use distinct accessible dialog titles',async()=>{
 const {act}=await import('react');const {BookingProvider,useBooking}=await import('../../src/components/public/booking.tsx');
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});const saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','HTMLDialogElement','Node','Event','sessionStorage','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 window.scrollTo=()=>{};window.HTMLElement.prototype.scrollIntoView=function(){};window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
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
