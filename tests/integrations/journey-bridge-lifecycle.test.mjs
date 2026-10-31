import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connectJourneyBridge} from '../../src/modules/tracking/journey-bridge.ts';
const origin='https://sightseeingshkodralivetrackingapp.netlify.app';
test('bridge validates sender, expires, reconnects after reload and cleans up remounts',t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:Date.now()});
 const listeners=new Set(),sent=[],received=[];
 const source={postMessage:(...args)=>sent.push(args)};
 const host={addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn)};
 const message=()=>({type:'shkodra:journey',version:1,unavailable:false,phase:'EN_ROUTE',movement:'On the way to Stop 2',lastObservationAt:new Date().toISOString(),statusValidUntil:new Date(Date.now()+10000).toISOString(),stops:[]});
 const emit=(data,extra={})=>{for(const fn of listeners)fn({origin,source,data,...extra});};
 const mount=()=>connectJourneyBridge(host,()=>source,origin,(...args)=>received.push(args));
 let bridge=mount();assert.equal(listeners.size,1);
 emit(message(),{origin:origin+'.evil.invalid'});emit(message(),{source:{}});emit({...message(),version:2});emit({...message(),movement:'x'.repeat(181)});assert.equal(received.length,0);
 emit({...message(),statusValidUntil:new Date(Date.now()-1).toISOString()});assert.equal(received.length,0);
 emit(message());assert.equal(received.length,1);
 t.mock.timers.tick(10001);assert.deepEqual(received.at(-1),[null,'stale']);
 const count=sent.length;t.mock.timers.tick(3000);assert(sent.length>count);
 emit(message());bridge.reset();assert.deepEqual(received.at(-1),[null,'loading']);
 emit(message());assert.equal(received.at(-1)[0].movement,'On the way to Stop 2');
 bridge.dispose();assert.equal(listeners.size,0);const final=sent.length;t.mock.timers.tick(60000);assert.equal(sent.length,final);
 bridge=mount();assert.equal(listeners.size,1);bridge.dispose();assert.equal(listeners.size,0);
 assert(sent.every(([data,target])=>target===origin&&data.version===1));
});


test('external display capability is explicit, expired replacement clears claims immediately',t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:Date.now()});
 const listeners=new Set(),sent=[],received=[],source={postMessage:(...args)=>sent.push(args)};
 const host={addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
 const bridge=connectJourneyBridge(host,()=>source,origin,(...args)=>received.push(args),true);
 assert.deepEqual(sent[0],[{type:'shkodra:request-journey',version:1,embeddedDisplayVersion:1},origin]);
 const data={type:'shkodra:journey',version:1,unavailable:false,stops:[],phase:'PARKED',movement:'Parked',lastObservationAt:new Date().toISOString(),statusValidUntil:new Date(Date.now()+10000).toISOString()};
 const display={version:1,label:'PARKED AT',destination:'Fixture',activity:'',eta:'',nextStop:'',live:false,stops:[]};
 const emit=(d,extra={})=>{for(const fn of listeners)fn({origin,source,data:d,...extra});};
 emit(data);assert.equal(received.length,0);
 data.embeddedDisplay=display;emit(data);assert.equal(received.length,1);
 for(const extra of [{origin:'http://127.0.0.1:4200'},{origin:'null'},{source:{}}])emit(data,extra);
 emit({...data,embeddedDisplay:{version:99}});assert.equal(received.length,1);
 emit({...data,statusValidUntil:new Date(Date.now()-1).toISOString()});assert.deepEqual(received.at(-1),[null,'stale']);
 bridge.reset();assert.deepEqual(received.at(-1),[null,'loading']);emit(data);assert.equal(received.at(-1)[0].movement,'Parked');
 bridge.dispose();assert.equal(listeners.size,0);const count=sent.length;t.mock.timers.tick(60000);assert.equal(sent.length,count);
 const legacy=connectJourneyBridge(host,()=>source,origin,()=>{});assert(!('embeddedDisplayVersion' in sent.at(-1)[0]));legacy.dispose();
});
