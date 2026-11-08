import {registerHooks,createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
registerHooks({load(url,c,next){
 if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};
 if(url.endsWith('/use-availability.ts'))return {format:'module',source:'export function useAvailability(){return globalThis.redesignAvailability} export const displayMoney=v=>String(v);',shortCircuit:true};
 return next(url,c);
}});
const require=createRequire(import.meta.url);
const availabilityPath=require.resolve('../../src/components/public/use-availability.ts');
require(availabilityPath);require.cache[availabilityPath].exports={useAvailability:()=>globalThis.redesignAvailability,displayMoney:v=>String(v)};
const {BookingProvider,useBooking,Header}=await import('../../src/components/public/booking.tsx');
const {CheckoutFlow}=await import('../../src/components/public/checkout-flow.tsx');

test('When/Who preserve selection and Review footer submits its original required form after portalling',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),saved=new Map();
 for(const name of ['window','self','document','navigator','HTMLElement','HTMLDialogElement','Node','Event','MouseEvent','KeyboardEvent','sessionStorage','IS_REACT_ACT_ENVIRONMENT']){
  saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});
 }
 window.scrollTo=()=>{};window.HTMLElement.prototype.scrollIntoView=function(){};
 const originalFetch=globalThis.fetch,calls=[];
 const hold={id:'fixture-hold',status:'active',departure_id:'open',quantity:1,expires_at:new Date(Date.now()+600000).toISOString()};
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options.body);calls.push(body);return Response.json(body.action==='hold'?{hold,serverNow:new Date().toISOString()}:{ok:true});};
 globalThis.redesignAvailability={loading:false,refresh(){},quote:{date:'2030-06-01',guests:1,currency:'EUR',total:1000,departures:[{id:'open',available:true,startTime:'11:00',remaining:8,passengerQuote:{total:1000,currency:"EUR",lines:[{category:"adult",quantity:1,unitPrice:1000,total:1000}]}}]}};
 let state;function Observe(){state=useBooking();return null;}
 let productHeading=true;const dialogStates=[];const onDialogStateChange=value=>dialogStates.push(value);
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 const render=()=>act(async()=>{root.render(React.createElement('main',{className:'p-book-page'},React.createElement(BookingProvider,{preview:true,product:{id:'10000000-0000-4000-8000-000000000020',primary:true,title:'Selected loop',slug:'loop',mode:'selected_departure',minutes:120}},React.createElement(Observe),React.createElement(CheckoutFlow,{productHeading,onDialogStateChange}),React.createElement('div',{'data-booking-page-footer':true}))));await Promise.resolve();});
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 const click=async text=>act(async()=>{button(text).click();await new Promise(r=>setTimeout(r,0));});
 const originalRaf=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>{fn();return 1;};
 try{
  await render();assert.deepEqual(dialogStates.at(-1),{dirty:false,busy:false});assert.equal(document.querySelector('.p-booking-product').textContent,'Selected loop');
  productHeading=false;await render();assert.equal(document.querySelector('.p-booking-product'),null);
  productHeading=true;await render();
  await act(()=>state.setSelection(s=>({...s,date:'2030-06-01',departureId:'open'})));
  assert.equal(document.querySelector('[aria-current="step"]').textContent.includes('When'),true);
  assert.equal(document.querySelector('[aria-label="Add one adult"]'),null);
  globalThis.redesignAvailability.loading=true;await render();assert.equal(button('Continue to passengers').disabled,true);
  globalThis.redesignAvailability.loading=false;globalThis.redesignAvailability.error='Synthetic availability error';await render();assert.equal(button('Continue to passengers').disabled,true);
  globalThis.redesignAvailability.error=undefined;await render();
  await click('Continue to passengers');assert.equal(calls.length,0);assert.ok(document.querySelector('[aria-label="Add one adult"]'));
  await act(()=>document.querySelector('[aria-label="Add one child"]').click());
  assert.equal(document.querySelector('[aria-label="Remove one adult"]').disabled,true);
  await act(()=>document.querySelector('[aria-label="Remove one child"]').click());
  globalThis.redesignAvailability.quote.departures[0].available=false;await render();
  await click('Back');assert.equal(button('Continue to passengers').disabled,true);
  await click('Edit passengers');assert.ok(document.querySelector('[aria-label="Add one adult"]'));
  globalThis.redesignAvailability.quote.departures[0].available=true;await render();
  await click('Back');assert.equal(state.selection.date,'2030-06-01');assert.equal(state.selection.departureId,'open');
  await click('Continue to passengers');await click('Continue to review');
  assert.deepEqual(calls.map(c=>c.action),['session','hold']);assert.equal(document.querySelector('[aria-current="step"]').textContent.includes('Review'),true);
  const form=document.querySelector('form'),submit=button('Review booking');
  assert.equal(submit.closest('[data-booking-page-footer]')!==null,true);assert.match(document.querySelector('.p-action-total').textContent,/1 June 2030.*11:00/);assert.equal(submit.form,form);
  assert.equal(form.querySelectorAll('input[required]').length,3);assert.equal(form.checkValidity(),false);
  await click('Review booking');assert.ok(document.querySelector('.p-contact-fields'));assert.equal(calls.length,2);
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  await act(()=>{const [name,email,phone]=form.querySelectorAll('input');setter.call(phone,'+355 69 123 4567');phone.dispatchEvent(new window.Event('input',{bubbles:true}));setter.call(name,'Synthetic Guest');name.dispatchEvent(new window.Event('input',{bubbles:true}));setter.call(email,'guest@example.test');email.dispatchEvent(new window.Event('input',{bubbles:true}));});
  assert.equal(dialogStates.at(-1).dirty,true);assert.equal(dialogStates.at(-1).busy,false);assert.ok(dialogStates.some(s=>s.busy));
  await click('Review booking');assert.ok(document.querySelector('.p-review-contact'));assert.equal(calls.length,2);
  assert.equal(dialogStates.at(-1).dirty,true);
  await click('Back');assert.equal(form.querySelector('input').value,'Synthetic Guest');
  await click('Back');assert.equal(state.selection.departureId,'open');assert.equal(state.selection.date,'2030-06-01');assert.deepEqual(calls.map(c=>c.action),['session','hold','release']);
 } finally {
  await act(()=>root.unmount());globalThis.fetch=originalFetch;globalThis.requestAnimationFrame=originalRaf;delete globalThis.redesignAvailability;dom.window.close();
  for(const [name,value] of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}
 }
});


test('mobile navigation booking returns focus to the visible menu toggle after closing',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/faq'}),saved=new Map();
 for(const name of ['window','self','document','navigator','HTMLElement','HTMLDialogElement','Node','Event','MouseEvent','KeyboardEvent','sessionStorage','IS_REACT_ACT_ENVIRONMENT']){
  saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});
 }
 window.scrollTo=()=>{};window.matchMedia=query=>({matches:query.includes('max-width'),addEventListener(){},removeEventListener(){}});
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
 globalThis.redesignAvailability={loading:false,refresh(){},quote:undefined};
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 try{
  await act(()=>root.render(React.createElement(BookingProvider,{preview:true},React.createElement(Header,{previewPathname:'/faq'}))));
  const toggle=document.querySelector('.p-menu-toggle');await act(()=>toggle.click());
  await act(()=>document.querySelector('.p-menu-book').click());assert.ok(document.querySelector('dialog[open]'));
  await act(()=>document.querySelector('dialog[open] [aria-label="Close booking"]').click());
  assert.equal(document.activeElement?.className,toggle.className);
 }finally{
  await act(()=>root.unmount());delete globalThis.redesignAvailability;dom.window.close();
  for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}
 }
});
