import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {BookingProvider,useBooking}=await import('../../src/components/public/booking.tsx');

test('booking lock freezes the measured body width and restores scroll and existing inline styles',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),saved=new Map();
 for(const name of ['window','self','document','navigator','HTMLElement','HTMLDialogElement','Node','Event','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 let y=0,width=1693;const scrolls=[];Object.defineProperty(window,'scrollY',{get:()=>y});window.scrollTo=(x,next)=>{scrolls.push([x,next]);y=next;};document.body.getBoundingClientRect=()=>({width});
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
 const original={position:'relative',top:'2px',width:'calc(100% - 2px)',overflow:'auto',paddingRight:'7px'};Object.assign(document.body.style,original);
 let context;function Trigger(){context=useBooking();return React.createElement('button',{onClick:e=>context.open(e.currentTarget)},'Open booking');}
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 try{
  await act(()=>root.render(React.createElement(BookingProvider,{preview:true},React.createElement(Trigger))));
  for(const [measured,offset]of [[1693,120],[1414,287],[390,63]]){
   width=measured;y=offset;await act(()=>document.querySelector('button').click());
   assert.equal(document.body.style.position,'fixed');assert.equal(document.body.style.top,`-${offset}px`);assert.equal(document.body.style.width,`${measured}px`);assert.equal(document.body.style.paddingRight,original.paddingRight);assert.equal(document.body.style.overflow,original.overflow);
   y=0;await act(()=>context.close());assert.equal(y,offset);assert.deepEqual(scrolls.at(-1),[0,offset]);for(const [key,value]of Object.entries(original))assert.equal(document.body.style[key],value);
   await new Promise(r=>setTimeout(r,10));
  }
 }finally{await act(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
