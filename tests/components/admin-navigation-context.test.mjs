import assert from 'node:assert/strict';
import {test} from 'node:test';
import {registerHooks,createRequire} from 'node:module';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
let mutations=0;
globalThis.__phaseAMutation=()=>{mutations++;throw Error('No fixture persistence allowed');};
registerHooks({load(url,c,next){
 if(url.endsWith('.module.css'))return {format:'module',source:'export default new Proxy({}, {get:(_,key)=>String(key)})',shortCircuit:true};
 return next(url,c);
}});
const require=createRequire(import.meta.url);
const actionsPath=require.resolve('../../src/app/admin/website-actions.ts');
require.cache[actionsPath]={id:actionsPath,filename:actionsPath,loaded:true,exports:{saveWebsiteSection:globalThis.__phaseAMutation,uploadWebsiteImage:globalThis.__phaseAMutation}};
const routerPath=require.resolve('next/navigation');
const existingRouter=require('next/navigation');
require.cache[routerPath].exports={...existingRouter,useRouter:()=>({refresh(){},push(){},replace(){}})};
const {WebsiteWorkspace}=await import('../../src/app/admin/website-workspace.tsx');
test('canonical Website context opens real editors; dirty fields survive refused navigation and Back restores view',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/admin/fixture/content?existing=kept',pretendToBeVisual:true});
 const saved=new Map();for(const name of ['self','window','document','navigator','HTMLElement','HTMLInputElement','HTMLDialogElement','HTMLDetailsElement','CustomEvent','Event','Node','requestAnimationFrame','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.querySelector('#root'));
 const record={id:'synthetic',updated_at:'2030-01-01T00:00:00Z',published_at:null,body:{content:{...initialWebsiteContent}},published_body:{content:{...initialWebsiteContent}}};
 async function navigate(context){const event=new CustomEvent('admin:navigate-context',{cancelable:true,detail:context});if(!window.dispatchEvent(event))return false;const next=new URL(window.location.href);next.hash='admin-nav='+context;window.history.pushState({},'',next);window.dispatchEvent(new Event('admin:context-changed'));return true;}
 try{
  await act(async()=>root.render(React.createElement(WebsiteWorkspace,{operatorId:'fixture',record,canPublish:false,canSensitive:false,destinationManager:React.createElement('p',null,'Canonical synthetic destinations')})));
  assert.equal(document.querySelector('h1').textContent,'Website');
  assert.equal(document.querySelectorAll('form[id^=cms-form]').length,0);
  await act(async()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Edit Homepage')).click();});assert.ok(document.querySelector('#cms-hero[open]'));
  await act(async()=>{const returned=new Promise(resolve=>window.addEventListener('hashchange',resolve,{once:true}));[...document.querySelectorAll('button')].find(b=>b.textContent==='Back to Website').click();await returned;});assert.ok(document.querySelector('[data-website-home]'));
  await act(async()=>{await navigate('destinations');});assert.match(document.body.textContent,/Canonical synthetic destinations/);
  await act(async()=>{const returned=new Promise(resolve=>window.addEventListener('hashchange',resolve,{once:true}));window.history.back();await returned;});assert.equal(document.querySelector('h1').textContent,'Website');
  await act(async()=>{await navigate('faq');});assert.ok(document.querySelector('#cms-faq[open]'));assert.equal(window.location.search,'?existing=kept');
  await act(async()=>{await navigate('seo');});assert.ok(document.querySelector('#cms-seo[open]'));
  await act(async()=>{await navigate('media');});assert.ok(document.querySelector('#cms-hero[open]'));
  const title=document.querySelector('input[name="hero.title"]');assert.ok(title);
  await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(title,'Unsaved synthetic heading');title.dispatchEvent(new Event('input',{bubbles:true}));title.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.match(document.body.textContent,/Unsaved changes/);
  let allowed;await act(async()=>{allowed=await navigate('faq');});assert.equal(allowed,false);assert.equal(title.value,'Unsaved synthetic heading');assert.ok(document.querySelector('#cms-hero[open]'));
  assert.ok([...document.querySelectorAll('button')].filter(b=>b.textContent==='Publish website changes').every(b=>b.disabled));assert.equal(mutations,0);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}delete globalThis.__phaseAMutation;}
});
