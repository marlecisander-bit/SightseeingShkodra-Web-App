import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {registerHooks} from 'node:module';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {BookingPushDevice}=await import('../../src/app/admin/booking-push-device.tsx');
import {PushRegistrationError} from '../../src/modules/notifications/registration-errors.ts';
test('one next action covers installation, enable, retry, success/test, denied permission, origin and preserved registrations',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://www.sightseeingshkodra.com/admin/workspace/notifications'}),saved=new Map();
 for(const name of ['window','document','navigator','location','HTMLElement','Node','Event','Notification','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 let standalone=true,allowed=false,subscribed=false,persisted=false,subscriptions=0,preferences=0,testResult={status:'accepted',code:'accepted'};
 const raw=Uint8Array.from({length:65},(_,i)=>i===0?4:i),key=Buffer.from(raw).toString('base64url'),id='10000000-0000-4000-8000-000000000001';
 const Permission={permission:'default',requestPermission:async()=>{Permission.permission='granted';return 'granted';}};
 globalThis.Notification=Permission;window.Notification=Permission;window.PushManager=function(){};
 Object.defineProperty(window,'isSecureContext',{value:true});Object.defineProperty(navigator,'userAgent',{value:'iPhone synthetic'});window.matchMedia=()=>({matches:standalone});
 const sub={endpoint:'https://web.push.apple.com/synthetic-secret-endpoint',options:{applicationServerKey:raw.buffer},expirationTime:null,toJSON:()=>({endpoint:'synthetic'}),unsubscribe:async()=>{subscribed=false;return true;}};
 const registration={active:{scriptURL:location.origin+'/admin/sw.js'},pushManager:{getSubscription:async()=>subscribed?sub:null,subscribe:async()=>{subscriptions++;subscribed=true;return sub;}}};
 Object.defineProperty(navigator,'serviceWorker',{value:{getRegistration:async()=>registration,register:async()=>registration}});
 const settings={publicKey:key,pushEnabled:true,configured:true,siteOrigin:location.origin,devices:[],preferences:[{type:'booking_created',in_app:true,push:true},{type:'booking_modified',in_app:true,push:true},{type:'booking_cancelled',in_app:true,push:true}]};
 const request=async(q,a)=>{if(a.kind==='subscribe'){if(!allowed)throw new PushRegistrationError('REGISTRATION_UNSAVED');persisted=true;}if(a.kind==='preference'){preferences++;settings.preferences.find(p=>p.type===a.type).push=a.push;}if(a.kind==='device-status')return persisted?{id,enabled:true}:null;if(a.kind==='test-push')return testResult;return {ok:true};};
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
 const render=()=>root.render(React.createElement(BookingPushDevice,{settings,request,onChanged:async()=>{}}));
 const settle=async action=>act(async()=>{action();await new Promise(resolve=>setTimeout(resolve,0));});
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 const action=()=>document.querySelector('section>div');
 try{
  await settle(render);assert.match(action().textContent,/Enable booking alerts/);assert.equal(document.querySelectorAll('input,select').length,0);assert.equal(document.querySelector('details').open,false);
  await settle(()=>button('Enable booking alerts').click());assert.match(action().textContent,/Fix alerts/);assert.equal(button('Enable booking alerts'),undefined);assert(!action().textContent.includes('enabled on this device'));
  allowed=true;await settle(()=>button('Fix alerts').click());assert.match(action().textContent,/This device is ready/);assert(button('Send test alert'));assert.equal(button('Enable booking alerts'),undefined);
  await settle(()=>button('Send test alert').click());assert(document.body.textContent.includes('Test sent. Did it appear'));await settle(()=>button('Yes, received').click());assert(document.body.textContent.includes('Test received on this device.'));assert(!document.body.textContent.includes(sub.endpoint));assert(!document.body.textContent.includes(key));
  testResult={status:'expired',code:'subscription_expired'};await settle(()=>button('Send test alert').click());assert(button('Fix alerts'));assert.equal(button('Send test alert'),undefined);await settle(()=>button('Fix alerts').click());assert(button('Send test alert'));
  const count=subscriptions;await settle(()=>window.dispatchEvent(new window.Event('focus')));await settle(render);assert.equal(subscriptions,count);
  settings.preferences[0].push=false;await settle(render);assert.equal(button('Enable booking alerts'),undefined);assert(button('Send test alert'));assert(!document.body.textContent.includes('saved preferences exclude'));assert.equal(preferences,0);assert.equal(subscriptions,count);assert.match(action().textContent,/This device is ready/);
  Permission.permission='denied';await settle(()=>window.dispatchEvent(new window.Event('focus')));assert.match(action().textContent,/Allow Shkodra Admin/);assert.equal(button('Enable booking alerts'),undefined);assert.equal(button('Send test alert'),undefined);
  Permission.permission='default';standalone=false;await settle(()=>window.dispatchEvent(new window.Event('focus')));assert.match(action().textContent,/Open as Web App on/);assert.equal(action().querySelector('button'),null);
  settings.siteOrigin='https://canonical.example';await settle(render);assert.equal(action().querySelector('a').textContent,'Open Admin');assert.equal(action().querySelector('button'),null);
 }finally{await settle(()=>root.unmount());dom.window.close();for(const [name,value]of saved){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}}
});
