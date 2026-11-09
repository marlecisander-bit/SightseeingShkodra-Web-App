import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
let times=['09:00:00','11:00:00','13:00:00','15:00:00'];
const calls=[];
globalThis.plannerHome=async()=>({product:{id:'ticket',title:'Daily ticket',active:false},adultFares:[{time:'11:00',amount:800}]});
globalThis.plannerClient={rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='inventory_product_v1'?'shared-van':times.map(start_time=>({start_time})),error:null};},from:()=>({select:()=>({eq:()=>({eq:async()=>({data:[{id:'schedule'}],error:null})})})})};
registerHooks({resolve(s,c,next){let source;
 if(s==='server-only')source='';
 if(s==='@supabase/supabase-js')source='export const createClient=()=>globalThis.plannerClient;';
 if(s.endsWith('/homepage-server'))source='export const getHomepage=()=>globalThis.plannerHome();';
 if(s.endsWith('/destination-stops-server'))source='export const getDestinationStops=async()=>({available:true,stops:[]});';
 return source!==undefined?{url:'data:text/javascript,'+encodeURIComponent(source),shortCircuit:true}:next(s,c);
},load(url,c,next){return url.startsWith('data:text/javascript,')?{format:'module',source:decodeURIComponent(url.slice(21)),shortCircuit:true}:next(url,c);}});
const {getDayPlanner}=await import('../../src/modules/content/day-planner-server.ts');
test('paused ticket preserves route timetable and product time removal is reflected on the next read',async()=>{
 const previous=process.env.PUBLIC_OPERATOR_ID;process.env.PUBLIC_OPERATOR_ID='operator';
 try{
  assert.deepEqual((await getDayPlanner()).times,['09:00','11:00','13:00','15:00']);
  times=['09:00:00','11:00:00','13:00:00'];
  const updated=await getDayPlanner();assert.deepEqual(updated.times,['09:00','11:00','13:00']);assert.deepEqual(updated.fares,[]);
  assert(calls.some(([name,args])=>name==='inventory_product_v1'&&args.p_product==='ticket'));
  times=[];assert.deepEqual((await getDayPlanner()).times,[]);
 }finally{if(previous===undefined)delete process.env.PUBLIC_OPERATOR_ID;else process.env.PUBLIC_OPERATOR_ID=previous;}
});
