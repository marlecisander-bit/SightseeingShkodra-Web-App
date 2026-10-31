import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {EmbeddedMapStatus}=await import('../../src/components/public/embedded-map-status.tsx');
const render=props=>renderToStaticMarkup(React.createElement(EmbeddedMapStatus,{reason:'loading',unavailable:false,onStop:()=>{},...props}));
test('loading, unavailable and expired displays contain no live stop or ETA claims',()=>{for(const props of [{},{unavailable:true},{reason:'stale'}]){const html=render(props);assert.match(html,/aria-label="Live van status"/);assert.match(html,/Waiting for a current update/);assert(!html.includes('aria-current'));assert(!html.includes('ETA'));}assert.match(render({reason:'stale'}),/Live status temporarily unavailable/);});
test('upstream copy is escaped, progress is keyboard accessible and only one step is current',()=>{const display={version:1,label:'PARKED AT',destination:'Lake <fixture>',activity:'Departure not confirmed',eta:'Travel · 12 min after departure',nextStop:'Castle fixture',live:false,stops:[{id:'1',number:'1',name:'Lake',label:'Here',state:'current'},{id:'2',number:'2',name:'Castle',label:'Next',state:'next'}]};const html=render({display});assert.match(html,/Lake &lt;fixture&gt;/);assert.match(html,/Travel · 12 min after departure/);assert.equal((html.match(/aria-current="step"/g)||[]).length,1);assert.equal((html.match(/type="button"/g)||[]).length,2);assert.match(html,/Next: Castle fixture/);assert(!html.includes('Live ·'));assert(!render({display:{...display,destination:'Castle fixture'}}).includes('Next: Castle fixture'));});


test('multiple next hints still render a single accessible current step',()=>{
 const stops=[1,2].map(n=>({id:String(n),number:String(n),name:'Fixture',label:'Next',state:'next'}));
 const html=render({display:{version:1,label:'STATUS',destination:'Fixture',activity:'',eta:'',nextStop:'',live:false,stops}});
 assert.equal((html.match(/aria-current="step"/g)||[]).length,1);
});

test('release gate controls the external panel and query; production never uses loopback',async()=>{
 const {LiveMapEmbed}=await import('../../src/components/public/live-map-embed.tsx');
 const {websiteExternalStatusEnabled}=await import('../../src/modules/tracking/public-map-binding.ts');
 assert.equal(typeof websiteExternalStatusEnabled,'boolean');
 if(process.env.NODE_ENV!=='development'){const fixtureAttempt=renderToStaticMarkup(React.createElement(LiveMapEmbed,{localPreview:true}));assert(!fixtureAttempt.includes('127.0.0.1'));assert.equal(fixtureAttempt.includes('websiteStatus='),websiteExternalStatusEnabled);}
 const html=renderToStaticMarkup(React.createElement(LiveMapEmbed,{presentation:'full'}));
 assert(html.includes('embed=1'));assert.equal(html.includes('websiteStatus='),websiteExternalStatusEnabled);assert.equal(html.includes('Live van status'),websiteExternalStatusEnabled);
 assert(html.includes('allow="geolocation"'));assert(html.includes('strict-origin-when-cross-origin'));
});
