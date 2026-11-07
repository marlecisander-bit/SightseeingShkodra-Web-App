import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createClient} from '@supabase/supabase-js';
registerHooks({resolve(s,c,next){if(s==='@/modules/identity/operator-service'&&c.parentURL?.endsWith('/daily-departures-server.ts'))return {url:'data:text/javascript,export const withOperatorService=(...args)=>globalThis.departuresAuthorization(...args)',shortCircuit:true};return next(s,c);},load(url,c,next){if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};return next(url,c);}});
const {getDailyDepartures}=await import('../../src/modules/dashboard/daily-departures-server.ts');
const op='10000000-0000-4000-8000-000000000001';
function fixture({empty=false,error=false,incomplete=false}={}){
 const calls=[];const client=createClient('https://fixture.invalid','synthetic-not-a-secret',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(String(input));calls.push({url,init});let data;
  if(url.pathname.endsWith('/operators'))data={timezone:'Europe/Tirane'};
  else if(url.pathname.endsWith('/service_schedules'))data=empty?[]:[{id:'schedule',product:{title:'Tour'}}];
  else data=error?{message:'Synthetic error'}:{days:[{date:'2026-10-25',slots:[{time:'09:00',open:true},{time:'15:00',open:true}]}]};
  return new Response(JSON.stringify(data),{status:error&&url.pathname.includes('/rpc/')?500:200,headers:{'content-type':'application/json','content-range':`0-0/${incomplete?2:empty?0:1}`}});
 }}});return {calls,client};
}
test('Home uses authorized read-only calendar projections, scoped complete schedule reads and local-time next departure',async()=>{
 const f=fixture();globalThis.departuresAuthorization=async(operator,permission,read)=>{assert.equal(operator,op);assert.equal(permission,'departures.manage');return read(f.client,{operatorId:op,staffProfileId:'staff'});};
 const result=await getDailyDepartures(op,new Date('2026-10-25T09:30:00Z'));assert.equal(result.state,'ready');assert.equal(result.count,2);assert.equal(result.next.time,'15:00');
 const schedule=f.calls.find(c=>c.url.pathname.endsWith('/service_schedules'));assert.equal(schedule.url.searchParams.get('operator_id'),'eq.'+op);assert.equal(schedule.url.searchParams.get('start_date'),'lte.2026-10-25');
 const rpc=f.calls.find(c=>c.url.pathname.includes('/rpc/'));assert.equal(rpc.url.pathname,'/rest/v1/rpc/read_operations_calendar_v1');assert.deepEqual(JSON.parse(rpc.init.body),{p_operator:op,p_actor:'staff',p_schedule:'schedule',p_month:'2026-10-01'});
});
test('empty schedules are zero; incomplete reads and calendar failures stay unavailable; authorization errors propagate',async()=>{
 for(const [options,state,count]of [[{empty:true},'ready',0],[{incomplete:true},'unavailable',null],[{error:true},'unavailable',null]]){
  const f=fixture(options);globalThis.departuresAuthorization=async(o,p,read)=>read(f.client,{operatorId:op,staffProfileId:'staff'});const result=await getDailyDepartures(op,new Date('2026-10-25T09:30:00Z'));assert.equal(result.state,state);assert.equal(result.count,count);
 }
 globalThis.departuresAuthorization=async()=>{throw Error('Access denied');};await assert.rejects(()=>getDailyDepartures(op,new Date()),/Access denied/);delete globalThis.departuresAuthorization;
});
