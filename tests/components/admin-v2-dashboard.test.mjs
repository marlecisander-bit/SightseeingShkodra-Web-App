import assert from 'node:assert/strict';
import {test} from 'node:test';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default new Proxy({}, {get:(_,key)=>String(key)})',shortCircuit:true};return next(url,c);}});
const {AppRouterContext}=await import('next/dist/shared/lib/app-router-context.shared-runtime.js');
const {OverviewPanel}=await import('../../src/app/admin/overview-panel.tsx');
const {DashboardNotifications,DashboardAttentionValue,NotificationContext}=await import('../../src/app/admin/notifications.tsx');
const {adminNavigationGroups}=await import('../../src/modules/identity/admin-navigation-layout.ts');
const {safeAdminReturn}=await import('../../src/modules/notifications/contracts.ts');
const op='10000000-0000-4000-8000-000000000001';
const now=new Date('2026-10-23T22:30:00Z');
function view(role){return new JSDOM(renderToStaticMarkup(React.createElement(OverviewPanel,{operatorId:op,role,now})));}
test('dashboard preserves unavailable vs zero, local service date and useful guarded links without any new reads',()=>{
 const dom=view('owner'),d=dom.window.document;
 assert.equal(d.querySelectorAll('section.metric').length,4);
 assert.equal(d.querySelectorAll('strong[aria-label="Unavailable"]').length,4);
 assert.match(d.body.textContent,/Saturday,? 24 October/);
 assert.deepEqual([...d.querySelectorAll('section.metric h2')].map(x=>x.textContent),['Passengers today','Booked revenue','Departures today','Need attention']);
 assert.equal(d.querySelector('h3').textContent,'Next departure');
 assert.match(d.body.textContent,/Schedule summary unavailable/);
 assert.ok(d.querySelector(`a[href="/admin/${op}/departures?date=2026-10-24"]`));
 assert.ok(d.querySelector(`a[href="/admin/${op}/bookings?date=2026-10-24"]`));
 assert.equal(d.querySelector('a[href*="live-map.html"]').target,'_blank');
 assert.doesNotMatch(d.body.textContent,/€180|5 \/ 8|0 passengers|No departures/);
 // Enforce the no-data-read dependency boundary, not a mocked result from a mutating reader.
 const source=readFileSync(new URL('../../src/app/admin/overview-panel.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(source,/fetch\(|\.from\(|\.rpc\(|prepareServiceDate|availability-server|schedules-server|createSessionClient/);
 dom.window.close();
});
test('content editor has no operational KPI, booking/create or calendar actions',()=>{
 const dom=view('content_editor'),d=dom.window.document;
 assert.equal(d.querySelectorAll('section.metric').length,0);
 assert.ok(!d.querySelector(`a[href*="/bookings"]`));assert.ok(!d.querySelector(`a[href*="/departures"]`));
 assert.match(d.body.textContent,/Open page editor/);assert.doesNotMatch(d.body.textContent,/Needs attention/);
 dom.window.close();
});
for(const [role,expected] of [['owner',['Home','Bookings','Tours','Website','More']],['admin',['Home','Bookings','Tours','Website','More']],['operations',['Home','Bookings','Tours','More']],['content_editor',['Home','Website','More']]])test(`${role} primary destinations expose only supported capability groups`,()=>{
 const g=adminNavigationGroups(op,role);assert.deepEqual(g.map(x=>x.label),expected);
 const items=g.flatMap(x=>x.items);assert.equal(new Set(items.map(x=>x.href)).size,items.length);
 assert.equal(items.some(x=>x.id==='email'),role==='owner');assert.equal(items.some(x=>x.id==='prices'),['owner','admin'].includes(role));
});
test('More has a validated internal sign-in return and rejects added external redirects',()=>{
 assert.equal(safeAdminReturn(`/admin/${op}/more`),`/admin/${op}/more`);
 assert.equal(safeAdminReturn(`/admin/${op}/more?next=https://example.com`),'/admin');
});
test('dashboard notification states reuse existing projection without triggering another request',()=>{
 let requests=0;const base={loading:false,operator:op,inbox:{items:[],unread:0,next:null},error:'',connection:'Live',version:0,refresh:async()=>{requests++;},mutate:async()=>{requests++;},request:async()=>{requests++;}};
 for(const [extra,expected] of [[{},/No notifications recorded/],[{loading:true},/Loading your notifications/],[{error:'Unavailable'},/Unavailable/],[{connection:'Reconnecting'},/Reconnecting/]]){
  const html=renderToStaticMarkup(React.createElement(NotificationContext.Provider,{value:{...base,...extra}},React.createElement(DashboardNotifications)));
  assert.match(html,expected);
 }
 assert.equal(requests,0);
});

test('attention KPI displays only the existing unread count and suppresses stale values while loading or failed',()=>{
 let requests=0;const base={loading:false,operator:op,inbox:{items:[],unread:0,next:null},error:'',connection:'Live',version:0,refresh:async()=>{requests++;},mutate:async()=>{requests++;},request:async()=>{requests++;}};
 for(const [extra,label,text] of [[{},'0 unread notifications','0'],[{inbox:{items:[],unread:7,next:null}},'7 unread notifications','7'],[{loading:true,inbox:{items:[],unread:7,next:null}},'Unavailable','—'],[{error:'Synthetic failure',inbox:{items:[],unread:7,next:null}},'Unavailable','—']]){
  const d=new JSDOM(renderToStaticMarkup(React.createElement(NotificationContext.Provider,{value:{...base,...extra}},React.createElement(DashboardAttentionValue))));
  assert.equal(d.window.document.querySelector('strong').getAttribute('aria-label'),label);assert.equal(d.window.document.querySelector('strong').textContent,text);d.window.close();
 }
 assert.equal(requests,0);
});

test('complete daily snapshots render numbers, real zeros and operator timezone without manufacturing departure totals',()=>{
 for(const [passengers,bookedMinor] of [[3,9000],[0,0]]){
  const snapshot={state:'ready',passengers,seats:2,bookedMinor,timeZone:'UTC',serviceDate:'2026-10-23',checkedAt:now.toISOString()};
  const d=new JSDOM(renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{refresh(){}}},React.createElement(OverviewPanel,{operatorId:op,role:'owner',now,snapshot}))));
  const values=[...d.window.document.querySelectorAll('section.metric strong')].map(x=>x.textContent);
  assert.deepEqual(values,[String(passengers),bookedMinor?'€90.00':'€0.00','—','—']);
  assert.match(d.window.document.body.textContent,/Friday,? 23 October/);assert.match(d.window.document.body.textContent,/Refresh dashboard/);
  assert.match(d.window.document.body.textContent,/Schedule summary unavailable/);d.window.close();
 }
});

test('pending dashboard snapshot shows loading without presenting a false empty total',()=>{
 const d=new JSDOM(renderToStaticMarkup(React.createElement(OverviewPanel,{operatorId:op,role:'owner',now,loading:true})));
 assert.match(d.window.document.body.textContent,/Loading daily totals/);assert.equal(d.window.document.querySelectorAll('strong[aria-label="Loading"]').length,2);d.window.close();
});

test('manual refresh requests one route refresh and reuses the provider refresh; mounting adds no request',async()=>{
 const {DashboardFreshness}=await import('../../src/app/admin/dashboard-freshness.tsx');
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),saved=new Map();
 for(const name of ['window','document','navigator','HTMLElement','Element','Node','Event','MouseEvent','IS_REACT_ACT_ENVIRONMENT']){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[name]});}
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.querySelector('#root'));let routes=0,inboxes=0;
 const snapshot={state:'ready',passengers:0,seats:0,bookedMinor:0,timeZone:'Europe/Tirane',serviceDate:'2026-10-24',checkedAt:now.toISOString()};
 const tree=React.createElement(AppRouterContext.Provider,{value:{refresh(){routes++;}}},React.createElement(NotificationContext.Provider,{value:{refresh:async()=>{inboxes++;}}},React.createElement(DashboardFreshness,{snapshot})));
 try{
  await act(async()=>root.render(tree));assert.equal(routes,0);assert.equal(inboxes,0);
  await act(async()=>document.querySelector('button').dispatchEvent(new MouseEvent('click',{bubbles:true})));
  assert.equal(routes,1);assert.equal(inboxes,1);assert.equal(document.querySelector('button').disabled,false);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [name,value]of saved)if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name];}
});
