import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks,createRequire} from 'node:module';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {blankDestination} from '../../src/modules/content/destinations.ts';
registerHooks({load(url,context,next){
 if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};
 return next(url,context);
}});
const require=createRequire(import.meta.url);
let writes=0;
const destinationAction=require.resolve('../../src/app/admin/destination-actions.ts');
require.cache[destinationAction]={id:destinationAction,filename:destinationAction,loaded:true,exports:{saveDestination:async()=>{writes++;return {saved:'fixture'};}}};
const imageAction=require.resolve('../../src/app/admin/website-actions.ts');
require.cache[imageAction]={id:imageAction,filename:imageAction,loaded:true,exports:{uploadWebsiteImage:async()=>{throw Error('No uploads in this test');}}};
const routerPath=require.resolve('next/navigation');
const navigation=require('next/navigation');
require.cache[routerPath].exports={...navigation,useRouter:()=>({refresh(){}})};
const {DestinationsEditor}=await import('../../src/app/admin/destinations-editor.tsx');
test('incomplete saved stop exposes every publication field and rejects Publish without a server write',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/admin/fixture/route-stops'});
 const saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','HTMLInputElement','Element','FormData','Event','Node','IS_REACT_ACT_ENVIRONMENT']){
  saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});
 }
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.querySelector('#root'));
 const stop={id:'map-stop',label:'Start/Stop'};
 const body={...blankDestination,name:'Start/Stop',slug:'start-stop',image:'/images/lake.webp',stopId:stop.id};
 const record={id:'fixture',body,published_body:null,status:'draft',updated_at:'stamp',destination_order:0,destination_aliases:[]};
 try{
  await act(async()=>root.render(React.createElement(DestinationsEditor,{operatorId:'fixture',records:[record],initialRecord:record,routeStop:stop,stops:[stop],stopsAvailable:true,canPublish:true})));
  for(const label of ['Image description','Short description','Search result title','Search result description']){
   const field=[...document.querySelectorAll('label')].find(l=>l.firstChild?.textContent===label);
   assert.ok(field,label);assert.equal(field.closest('details'),null,`${label} must be visible without expanding optional details`);
  }
  assert.match(document.body.textContent,/Before publishing, complete: Image description, Short description, Search result title, Search result description/);
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Publish').click());
  assert.equal(writes,0,'incomplete destination never reaches the save action');
  assert.ok(document.querySelector('input').value==='Start/Stop','failed publication preserves edits');
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Save Draft').click());
  assert.equal(writes,1,'incomplete entries can still be saved privately');
 }finally{
  await act(async()=>root.unmount());dom.window.close();
  for(const [name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}
 }
});
