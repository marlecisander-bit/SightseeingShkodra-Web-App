import assert from 'node:assert/strict';
import {test} from 'node:test';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {adminNavigationGroups} from '../../src/modules/identity/admin-navigation-layout.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default new Proxy({}, {get:(_,key)=>String(key)})',shortCircuit:true};return next(url,c);}});
const {AdminNavigation}=await import('../../src/app/admin/admin-navigation.tsx');
const props={groups:adminNavigationGroups('fixture','owner'),section:'content',account:React.createElement('a',{href:'/admin'},'Switch workspace')};
test('six direct mobile links share role-filtered desktop groups; canonical URLs and external behavior survive',()=>{
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(AdminNavigation,props))),d=dom.window.document;
 assert.equal(d.querySelectorAll('aside details.taskGroup').length,4);
 const home=d.querySelector('aside nav > a');
 assert.equal(home.textContent,'Home');
 assert.equal(home.getAttribute('href'),'/admin/fixture/overview');
 assert(!d.body.textContent.includes('Today’s overview'));
 const overview=new JSDOM(renderToStaticMarkup(React.createElement(AdminNavigation,{...props,section:'overview'})));
 assert.equal(overview.window.document.querySelector('aside [aria-current=page]').textContent,'Home');
 assert.equal(overview.window.document.querySelectorAll('aside details.taskGroup[open]').length,0);
 overview.window.close();
 assert.equal(d.querySelectorAll('aside details.taskGroup[open]').length,1);
 assert.equal(d.querySelector('.taskGroup[open] summary').textContent.trim(),'Website');
 const links=[...d.querySelectorAll('nav[aria-label="Primary admin navigation"] > a')];
 assert.deepEqual(links.map(x=>x.textContent),['Home','Bookings','Tours','Products','Website','More']);
 assert.deepEqual(links.map(x=>x.getAttribute('href')),['/admin/fixture/overview','/admin/fixture/bookings','/admin/fixture/departures?view=today#admin-nav=today','/admin/fixture/products','/admin/fixture/content','/admin/fixture/more']);
 assert.equal(d.querySelectorAll('aside [aria-current=page]').length,1);
 assert.equal(d.querySelector('a[href*="netlify.app"]').rel,'noopener noreferrer');
 const booking=d.querySelector('aside nav > a[href="/admin/fixture/bookings"]');
 assert.equal(booking.textContent,'Bookings');
 assert.ok(booking.querySelector('[data-admin-icon="calendar-check"]'));
 assert.equal(booking.querySelector('[data-admin-icon="chevron-down"]'),null);
 assert.ok(!d.body.textContent.includes('Reservations'));
 const products=[...d.querySelectorAll('aside details.taskGroup')].find(x=>x.querySelector('summary').textContent.trim()==='Products');
 assert.ok(products.querySelector('summary [data-admin-icon="package"]'));
 assert.deepEqual([...products.querySelectorAll('li a')].map(x=>x.textContent),['All products','Suppliers']);
 assert.ok(links[1].querySelector('[data-admin-icon="calendar-check"]'));
 assert.ok(links[3].querySelector('[data-admin-icon="package"]'));
 const bookings=new JSDOM(renderToStaticMarkup(React.createElement(AdminNavigation,{...props,section:'bookings'})));
 assert.deepEqual([...bookings.window.document.querySelectorAll('[aria-current="page"]')].map(x=>x.textContent),['Bookings','Bookings']);
 bookings.window.close();
 assert.equal(d.querySelectorAll('dialog').length,0,'primary destinations do not create temporary history entries');
 dom.window.close();
});
test('same-page contexts retain filters, respect dirty state and update active selection',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/admin/fixture/content?existing=kept',pretendToBeVisual:true});const saved=new Map();
 for(const name of ['self','window','document','navigator','HTMLElement','CustomEvent','Event','Node','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:name==='self'?dom.window:dom.window[name]});}
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.querySelector('#root'));
 try{
  await act(async()=>root.render(React.createElement(AdminNavigation,props)));
  const guard=e=>e.preventDefault();window.addEventListener('admin:navigate-context',guard);
  await act(async()=>document.querySelector('aside a[href$="admin-nav=faq"]').click());assert.equal(window.location.hash,'');
  window.removeEventListener('admin:navigate-context',guard);
  await act(async()=>document.querySelector('aside a[href$="admin-nav=faq"]').click());
  assert.equal(window.location.search,'?existing=kept');assert.equal(window.location.hash,'#admin-nav=faq');
  assert.match(document.querySelector('aside [aria-current=page]').textContent,/FAQ & policies/);
  assert.equal(document.querySelector('.bottomNavigation [aria-current=page]').textContent,'Website');
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
});
