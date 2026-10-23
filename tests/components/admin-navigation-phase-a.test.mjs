import assert from 'node:assert/strict';
import {test} from 'node:test';
import {registerHooks,createRequire} from 'node:module';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {adminNavigationGroups} from '../../src/modules/identity/admin-navigation-layout.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default new Proxy({}, {get:(_,key)=>String(key)})',shortCircuit:true};return next(url,c);}});
const require=createRequire(import.meta.url);const navPath=require.resolve('next/navigation');const nav=require('next/navigation');const pushed=[];require.cache[navPath].exports={...nav,useRouter:()=>({push:url=>pushed.push(url)})};
const {AdminNavigation}=await import('../../src/app/admin/admin-navigation.tsx');
const props={groups:adminNavigationGroups('fixture','owner'),section:'content',account:React.createElement('a',{href:'/admin'},'Switch workspace')};
test('desktop sections collapse; mobile has four destinations and no fake future tools',()=>{
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(AdminNavigation,props)));
 const d=dom.window.document;
 assert.equal(d.querySelectorAll('aside details.taskGroup').length,5);
 assert.equal(d.querySelectorAll('aside details.taskGroup[open]').length,1);
 assert.equal(d.querySelector('.taskGroup[open] summary').textContent.replace('⌄','').trim(),'Website');
 assert.deepEqual([...d.querySelectorAll('nav[aria-label="Primary admin navigation"] > *')].map(x=>x.textContent),['Home','Bookings','Tours','More']);
 assert.ok([...d.querySelectorAll('button')].every(b=>b.type==='button'));
 assert.equal(d.querySelectorAll('aside [aria-current=page]').length,1);
 assert.equal(d.querySelector('a[href*="netlify.app"]').rel,'noopener noreferrer');
 assert.ok(!d.body.textContent.includes('Staff & Permissions'));
 dom.window.close();
});
test('task menu closes with Back, restores focus/scroll, and dirty context navigation is cancelled',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/admin/fixture/content?existing=kept',pretendToBeVisual:true});
 const saved=new Map();
 for(const name of ['self','window','document','navigator','HTMLElement','HTMLDialogElement','HTMLDetailsElement','CustomEvent','Event','Node','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:name==='self'?dom.window:dom.window[name]});}
 dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.querySelector('#root'));
 const pause=()=>new Promise(r=>setTimeout(r,30));
 try{
  await act(async()=>root.render(React.createElement(AdminNavigation,props)));
  const more=[...document.querySelectorAll('.bottomNavigation button')].find(x=>x.textContent==='More');more.focus();
  await act(async()=>more.click());assert.ok(document.querySelector('dialog').open);assert.equal(document.body.style.overflow,'hidden');
  assert.ok(document.querySelector('dialog').textContent.includes('Website'));assert.ok(!document.querySelector('dialog').textContent.includes('Reservations'));
  await act(async()=>{window.history.back();await pause();});
  assert.equal(document.querySelector('dialog').open,false);assert.equal(document.activeElement,more);assert.equal(document.body.style.overflow,'');
  const guard=e=>e.preventDefault();window.addEventListener('admin:navigate-context',guard);
  await act(async()=>document.querySelector('aside a[href$="admin-nav=faq"]').click());assert.equal(window.location.hash,'');
  window.removeEventListener('admin:navigate-context',guard);
  await act(async()=>document.querySelector('aside a[href$="admin-nav=faq"]').click());
  assert.equal(window.location.search,'?existing=kept');assert.equal(window.location.hash,'#admin-nav=faq');assert.equal(document.querySelector('aside [aria-current=page]').textContent,'FAQ & PoliciesFAQ, Privacy and Terms in their canonical editors.');
  await act(async()=>more.click());
  const routeLink=[...document.querySelectorAll('dialog a')].find(n=>n.textContent.startsWith('Route stops: names & images'));
  await act(async()=>{routeLink.click();await pause();});
  assert.equal(document.querySelector('dialog').open,false);assert.equal(pushed.at(-1),'/admin/fixture/route-stops');assert.equal(window.location.pathname,'/admin/fixture/content');

 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
});
