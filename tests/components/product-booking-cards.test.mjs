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
test('product cards preserve public facts and direct URLs with dialog enhancement',()=>{
 const html=renderToStaticMarkup(React.createElement(ProductBookingCards,{products:[{...loop,adultPrice:1200,card:{...loop.card,features:['audio_guide']}},{...loop,id:source.id,title:'Whole-day ticket',mode:'whole_day',adultPrice:0}],content:initialWebsiteContent}));
 const dom=new JSDOM(html),d=dom.window.document;assert.equal(d.querySelector('section').getAttribute('aria-label'),'Book your experience');assert.equal(d.querySelector('h2').className,'p-screen-reader-only');assert.equal(d.querySelectorAll('[data-product-booking]').length,4);assert.equal(d.querySelectorAll('article').length,2);assert.equal(d.querySelectorAll('img').length,2);assert.equal(d.querySelectorAll('input,select,form,details').length,0);assert.equal(d.querySelectorAll('dialog').length,2);assert.equal(d.querySelectorAll('dialog[open]').length,0);
 const cards=[...d.querySelectorAll('article')];assert.equal(cards[0].querySelector('h3').textContent,loop.title);assert.doesNotMatch(cards[0].textContent,/2 hours reservation/);assert.match(cards[0].textContent,/Audio guide/);assert.match(cards[0].textContent,/12.00/);assert.doesNotMatch(cards[1].textContent,/Whole-day reservation/);assert.match(cards[1].textContent,/0.00/);
 for(const [i,product]of [loop,{id:source.id}].entries()){const links=cards[i].querySelectorAll('a');assert.equal(links.length,1);assert.equal(links[0].getAttribute('aria-haspopup'),'dialog');assert.equal(links[0].getAttribute('href'),`/book?productId=${product.id}`);assert.equal(cards[i].querySelector('div').textContent.includes('Published loop description'),false);}
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
  await act(()=>root.render(React.createElement(BookingProvider,{preview:true,currentMeetingPoint:point,content:{...initialWebsiteContent,'bookingDialog.title':'Saved CMS booking heading'}},React.createElement(BookingProvider,{preview:true,product:loop},React.createElement(Observe,{id:'loop'})),React.createElement(BookingProvider,{preview:true,product:{...loop,id:source.id}},React.createElement(Observe,{id:'other'})))));
  await act(()=>contexts.get('loop').setSelection(s=>({...s,date:'2030-06-01',guests:2,departureId:'synthetic'})));
  assert.equal(contexts.get('loop').selection.productId,loop.id);assert.equal(contexts.get('other').selection.productId,source.id);assert.equal(contexts.get('other').selection.date,'');assert.deepEqual(contexts.get('loop').currentMeetingPoint,point);assert.equal(contexts.get('loop').content['bookingDialog.title'],'Saved CMS booking heading');
  sessionStorage.setItem('shkodra-checkout-v1:'+loop.id,'loop');sessionStorage.setItem('shkodra-checkout-v1:'+source.id,'other');sessionStorage.setItem('shkodra-checkout-v1','primary');
  await act(()=>contexts.get('loop').reset());assert.equal(sessionStorage.getItem('shkodra-checkout-v1:'+loop.id),null);assert.equal(sessionStorage.getItem('shkodra-checkout-v1:'+source.id),'other');assert.equal(sessionStorage.getItem('shkodra-checkout-v1'),'primary');
  await act(()=>{contexts.get('loop').open();contexts.get('other').open();});const dialogs=[...document.querySelectorAll('dialog[open]')];assert.equal(dialogs.length,2);
  const ids=dialogs.map(d=>d.getAttribute('aria-labelledby'));assert.equal(new Set(ids).size,2);for(const dialog of dialogs){assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')),dialog.querySelector('h2'));assert.equal(dialog.querySelector('h2').textContent,'Saved CMS booking heading');}
 }finally{await act(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});

test('compact homepage cards keep complete CMS details and direct product booking links',()=>{
 const product={...loop,adultPrice:1200,card:{...loop.card,features:['audio_guide','wifi','air_conditioning','walking']}};
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(ProductBookingCards,{products:[product],content:initialWebsiteContent,embedded:true}))),d=dom.window.document;
 try{const details=d.querySelector('details[data-product-details]');assert.ok(details);assert.equal(details.open,false);assert.equal(details.querySelector('summary').textContent,'View details');assert.match(details.querySelector('summary').getAttribute('aria-label'),/Sightseeing Loop Tour/);assert.match(details.textContent,/Published loop description/);assert.match(details.textContent,/selected departure/);const amenities=d.querySelector('ul[aria-label="Sightseeing Loop Tour information"]');for(const text of ['Audio guide','Wi-Fi','Air conditioned','Walking included'])assert.ok(amenities.textContent.includes(text));assert.equal(details.querySelector('ul'),null);assert.equal(d.querySelector('[data-all-amenities]').getAttribute('aria-haspopup'),'dialog');assert.equal(d.querySelector('[data-all-amenities]').textContent,'All amenities');assert.equal(d.querySelector('a[aria-haspopup=dialog]').getAttribute('href'),`/book?productId=${loop.id}`);assert.match(d.querySelector('[data-product-booking]').textContent,/12.00/);}finally{dom.window.close();}
});

test('inactive products keep order and information, escape custom messages and omit all booking links; reactivation hides ribbon',()=>{
 const message='<img src=x onerror=alert(1)> Coming soon — së shpejti';
 const disabled={...loop,active:false,displayOrder:0,unavailableMessage:message,adultPrice:1000};
 const enabled={...loop,id:source.id,displayOrder:1,title:'Available ticket',active:true};
 const render=products=>new JSDOM(renderToStaticMarkup(React.createElement(ProductBookingCards,{products,content:initialWebsiteContent,embedded:true})));
 const dom=render([enabled,disabled]),cards=[...dom.window.document.querySelectorAll('article')];
 assert.equal(cards[0].querySelector('h3').textContent,loop.title);assert.equal(cards[0].dataset.inactive,'true');assert.equal(cards[0].querySelectorAll('a,dialog').length,0);assert(cards[0].querySelector('button[disabled]'));assert.match(cards[0].textContent,/Unavailable for booking/);assert(cards[0].textContent.includes(message));assert.equal(cards[0].querySelectorAll('img').length,1);assert(cards[0].querySelector('details'));assert.equal(cards[1].querySelector('a').getAttribute('href'),`/book?productId=${source.id}`);dom.window.close();
 const active=render([{...disabled,active:true}]);assert.equal(active.window.document.querySelector('[data-inactive]'),null);assert(!active.window.document.body.textContent.includes(message));assert(active.window.document.querySelector('a'));active.window.close();
});

test('primary homepage fallback retains product-owned inactive state when the directory is unavailable',async()=>{
 const {HomepageView}=await import('../../src/components/public/homepage-view.tsx');
 const {emptyHomepage}=await import('../../src/modules/content/homepage.ts');
 const home={...emptyHomepage('ready'),product:{id:loop.id,slug:loop.slug,title:loop.title,description:null,stops:[],active:false,unavailableMessage:'Maintenance',displayOrder:2}};
 const {BookingProvider}=await import('../../src/components/public/booking.tsx');
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(BookingProvider,{preview:true},React.createElement(HomepageView,{home,content:initialWebsiteContent,products:[]}))));
 const card=dom.window.document.querySelector('#experiences article');assert.equal(card.dataset.inactive,'true');assert.match(card.textContent,/Maintenance/);assert.equal(card.querySelector('a'),null);dom.window.close();
});
