import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createClient} from '@supabase/supabase-js';
import {readFileSync} from 'node:fs';
registerHooks({resolve(s,c,next){if(s==='@/modules/identity/operator-service'&&c.parentURL?.endsWith('/daily-bookings-server.ts'))return {url:'data:text/javascript,export const withOperatorService=(...args)=>globalThis.dashboardAuthorization(...args)',shortCircuit:true};return next(s,c);},load(url,c,next){if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};return next(url,c);}});
const {readDailyBookings,getDailyBookings}=await import('../../src/modules/dashboard/daily-bookings-server.ts');
const {summarizeBookings,dashboardDate,dashboardIsStale,formatBookedEUR}=await import('../../src/modules/dashboard/daily-bookings.ts');
const {runAuthorizedOperation}=await import('../../src/modules/identity/privileged-operation.ts');
const {hasPermission}=await import('../../src/modules/identity/roles.ts');
const op='10000000-0000-4000-8000-000000000001',now=new Date('2026-10-23T22:30:00Z');
const row=(extra={})=>({id:'item-1',operator_id:op,status:'confirmed',quantity:3,occupied_seats:2,total_price:9000,departure:{operator_id:op,service_date:'2026-10-24'},order:{operator_id:op,status:'confirmed',currency:'EUR',booking:{operator_id:op,status:'confirmed'}},...extra});
function clientFixture({rows=[row()],count=rows.length,timezone='Europe/Tirane',error=false}={}){
 const calls=[];const client=createClient('https://fixture.invalid','synthetic-not-a-secret',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(String(input));calls.push({url,init});
  if(url.pathname.endsWith('/operators'))return new Response(JSON.stringify({timezone}),{status:200,headers:{'content-type':'application/json'}});
  return new Response(JSON.stringify(error?{message:'Synthetic failure'}:rows),{status:error?500:200,headers:{'content-type':'application/json','content-range':count===null?'*/*':`0-${Math.max(0,rows.length-1)}/${count}`}});
 }}});return {client,calls};
}
test('single complete item read counts people including infants, separate occupied seats and immutable minor-unit amounts',()=>{
 const result=summarizeBookings(op,now,'Europe/Tirane',[row(),row({id:'item-2',quantity:1,occupied_seats:1,total_price:'1700'})],2);
 assert.equal(result.state,'ready');assert.equal(result.passengers,4);assert.equal(result.seats,3);assert.equal(result.bookedMinor,10700);assert.equal(result.serviceDate,'2026-10-24');
});
test('complete empty is zero; truncated, missing exact count, excessive and duplicate pages never become totals',()=>{
 assert.equal(summarizeBookings(op,now,'Europe/Tirane',[],0).bookedMinor,0);
 for(const [rows,count] of [[[row()],2],[[row()],null],[[row(),row()],2],[Array.from({length:1001},(_,i)=>row({id:`item-${i}`})),1001]])assert.equal(summarizeBookings(op,now,'Europe/Tirane',rows,count).state,'unavailable');
 const rows=Array.from({length:1000},(_,i)=>row({id:`item-${i}`}));assert.equal(summarizeBookings(op,now,'Europe/Tirane',rows,1000).passengers,3000);
});
test('fail closed for cross-operator joins, cancelled/ineligible records, wrong date and unsupported currencies',()=>{
 for(const r of [row({operator_id:'other'}),row({status:'cancelled'}),row({departure:{operator_id:op,service_date:'2026-10-23'}}),row({order:{...row().order,status:'cancelled'}}),row({order:{...row().order,currency:'USD'}}),row({order:{...row().order,booking:{operator_id:op,status:'cancelled'}}}),row({order:{...row().order,booking:{operator_id:'other',status:'confirmed'}}}),row({order:null})])assert.equal(summarizeBookings(op,now,'Europe/Tirane',[r],1).state,'unavailable');
});
test('malformed category/seat values and unsafe or overflowing money are unavailable',()=>{
 for(const r of [row({quantity:0}),row({occupied_seats:4}),row({occupied_seats:0}),row({total_price:'9007199254740992'}),row({total_price:-1}),row({total_price:'1e3'}),row({quantity:1.5})])assert.equal(summarizeBookings(op,now,'Europe/Tirane',[r],1).state,'unavailable');
 assert.equal(summarizeBookings(op,now,'Europe/Tirane',[row({total_price:Number.MAX_SAFE_INTEGER}),row({id:'item-2',total_price:1})],2).state,'unavailable');
});
test('wire query uses GET, exact count, all tenant/date/lifecycle filters, bounded results and no RPC',async()=>{
 const f=clientFixture(),result=await readDailyBookings(f.client,op,now);assert.equal(result.passengers,3);assert.equal(f.calls.length,2);
 const q=f.calls[1];assert.equal(q.init.method,'GET');assert.match(q.init.headers.get('prefer'),/count=exact/);
 assert.equal(q.url.pathname,'/rest/v1/booking_items');
 for(const [k,v] of Object.entries({operator_id:op,status:'confirmed','departure.operator_id':op,'departure.service_date':'2026-10-24','order.operator_id':op,'order.status':'confirmed','order.booking.operator_id':op,'order.booking.status':'confirmed'}))assert.equal(q.url.searchParams.get(k),`eq.${v}`);
 assert.equal(q.url.searchParams.get('limit'),'1001');assert.match(q.url.searchParams.get('select'),/orders!inner.*bookings!inner/);
});
test('wire reader rejects server caps even below requested limit, query failure, unknown timezone and uses operator timezone',async()=>{
 for(const options of [{count:1001},{count:null},{error:true},{timezone:'invalid/timezone'}]){const f=clientFixture(options);assert.equal((await readDailyBookings(f.client,op,now)).state,'unavailable');}
 const f=clientFixture({timezone:'UTC',rows:[row({departure:{operator_id:op,service_date:'2026-10-23'}})]});assert.equal((await readDailyBookings(f.client,op,now)).serviceDate,'2026-10-23');
});
test('authorized entry checks bookings.read before constructing a client; revoked and content-only access cannot read',async()=>{
 for(const role of ['owner','admin','operations','content_editor','revoked']){
  let created=0;const f=clientFixture();
  globalThis.dashboardAuthorization=(id,permission,operation)=>runAuthorizedOperation(id,permission,async()=>{assert.equal(permission,'bookings.read');if(!hasPermission(role,permission))throw new Error('FORBIDDEN');return {operatorId:id,role};},()=>{created++;return f.client;},operation);
  if(hasPermission(role,'bookings.read'))assert.equal((await getDailyBookings(op,now)).state,'ready');else {await assert.rejects(getDailyBookings(op,now),/FORBIDDEN/);assert.equal(created,0);assert.equal(f.calls.length,0);}
 }
 delete globalThis.dashboardAuthorization;
});
test('date boundary/DST and snapshot expiry are explicit; no clock-based operational status',()=>{
 assert.equal(dashboardDate(new Date('2026-10-24T22:30Z')),'2026-10-25');assert.equal(dashboardDate(new Date('2026-10-25T22:30Z')),'2026-10-25');
 assert.equal(dashboardIsStale(now.toISOString(),'Europe/Tirane','2026-10-24',new Date(now.getTime()+119999)),false);
 assert.equal(dashboardIsStale(now.toISOString(),'Europe/Tirane','2026-10-24',new Date(now.getTime()+120000)),true);
 assert.equal(dashboardIsStale(now.toISOString(),'UTC','2026-10-23',new Date('2026-10-24T00:00Z')),true);
});
test('data adapter contains only existing SELECTs; no caches, mutators or preparation dependency',()=>{
 const source=readFileSync(new URL('../../src/modules/dashboard/daily-bookings-server.ts',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\.rpc\(|\.insert\(|\.update\(|\.delete\(|\.upsert\(|prepareServiceDate|availability-server|schedules-server|unstable_cache|use cache/);
 assert.match(source,/withOperatorService\(operatorId,'bookings.read'/);
});

test('EUR formatting preserves every minor unit without floating-point rounding',()=>{
 assert.equal(formatBookedEUR(0),'€0.00');assert.equal(formatBookedEUR(1501),'€15.01');assert.equal(formatBookedEUR(Number.MAX_SAFE_INTEGER),'€90,071,992,547,409.91');
});
