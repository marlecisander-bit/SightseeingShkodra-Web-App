import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createTestDatabase,loadDevelopmentFixtures,setTestClock} from '../helpers/database.mjs';
import {quoteAvailability} from '../../src/modules/booking/availability.ts';
let db,actor,product,schedule;
const op='10000000-0000-4000-8000-000000000001';
const times=['09:00','11:00','13:00','15:00'];
const all=times.map(t=>t+':00');
async function snapshot(date){return (await db.query('select read_availability_v1($1,$2,$3) as data',[op,product,date])).rows[0].data;}
async function at(now,date){await setTestClock(db,now);return (await snapshot(date)).departures.map(d=>d.start_time);}
async function exception(date,restore=false){
 const stamp=(await db.query('select updated_at::text as stamp from service_schedules where id=$1',[schedule])).rows[0].stamp;
 await db.query('select save_schedule_exception_v1($1,$2,$3,$4,false,$5,$6,$7,$8)',[op,actor,schedule,date,JSON.stringify(times.slice(1).map(time=>({time}))),'Isolated regression exception',restore,stamp]);
}
before(async()=>{
 db=await createTestDatabase({now:'2026-01-01T00:00:00Z'});await loadDevelopmentFixtures(db);
 const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
 product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules) values($1,'van_tour','Clock regression','clock-regression','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1500}','{"version":1,"model":"departure_seats"}') returning id`,[op])).rows[0].id;
 schedule=(await db.query("select save_service_schedule_v1($1,$2,$3,'2026-01-01','2026-12-31',array[1,2,3,4,5,6,7],$4,8,null,'active',null) as id",[op,actor,product,JSON.stringify(times.map(time=>({time})))])).rows[0].id;
});
after(async()=>db?.close());
test('A: today before 09:00 includes every configured time',async()=>assert.deepEqual(await at('2026-09-24T06:00:00Z','2026-09-24'),all));
test('B: today 10:15 Tirane excludes only departed 09:00',async()=>assert.deepEqual(await at('2026-09-24T08:15:00Z','2026-09-24'),all.slice(1)));
test('C: today 12:00 Tirane includes 13:00 and 15:00',async()=>assert.deepEqual(await at('2026-09-24T10:00:00Z','2026-09-24'),all.slice(2)));
test('D/E: at 14:00 today, tomorrow and later retain all times',async()=>{
 for(const date of ['2026-09-25','2026-10-02'])assert.deepEqual(await at('2026-09-24T12:00:00Z',date),all);
});
test('F: past day is not bookable, including already materialized inventory',async()=>assert.deepEqual(await at('2026-09-25T06:00:00Z','2026-09-24'),[]));
test('G: server session timezone cannot change service availability',async()=>{
 for(const zone of ['UTC','America/Los_Angeles','Asia/Tokyo']){
  await db.query("select set_config('TimeZone',$1,false)",[zone]);
  assert.deepEqual(await at('2026-09-24T12:00:00Z','2026-09-25'),all);
 }
});
test('midnight follows Europe/Tirane, not UTC date',async()=>{
 assert.deepEqual(await at('2026-09-24T22:30:00Z','2026-09-25'),all);
 assert.deepEqual(await at('2026-09-24T22:30:00Z','2026-09-24'),[]);
});
test('09:00 cutoff follows both DST changes and exact 15-minute boundary',async()=>{
 for(const [date,before,after] of [['2026-03-29','2026-03-29T06:44:59Z','2026-03-29T06:45:00Z'],['2026-10-25','2026-10-25T07:44:59Z','2026-10-25T07:45:00Z']]){
  assert.deepEqual(await at(before,date),all);assert.deepEqual(await at(after,date),all.slice(1));
 }
});
test('date exception is authoritative; restoring it returns missing time with inherited capacity',async()=>{
 await setTestClock(db,'2026-09-24T12:00:00Z');
 const original=await snapshot('2026-09-25');
 await exception('2026-09-25');
 assert.deepEqual((await snapshot('2026-09-25')).departures.map(d=>d.start_time),all.slice(1));
 assert.deepEqual((await snapshot('2026-09-26')).departures.map(d=>d.start_time),all);
 await exception('2026-09-25',true);
 const restored=await snapshot('2026-09-25');
 assert.deepEqual(restored.departures.map(d=>d.start_time),all);
 assert.deepEqual(restored.departures.map(d=>d.id),original.departures.map(d=>d.id));
 assert.ok(restored.departures.every(d=>d.capacity===8&&d.held===0&&d.committed===0));
});
test('full inventory remains visible but disabled, not mistaken for a past time',async()=>{
 await setTestClock(db,'2026-09-24T12:00:00Z');const snap=await snapshot('2026-09-25'),d=snap.departures[0];
 await db.query('select create_hold_v1($1,$2,$3,gen_random_uuid(),8)',[op,d.id,'clock-regression-session-1234567890']);
 const quote=quoteAvailability({version:1,operatorId:op,productId:product,date:'2026-09-25',guests:1},await snapshot('2026-09-25'));
 assert.equal(quote.departures[0].startTime,'09:00:00');assert.equal(quote.departures[0].available,false);assert.equal(quote.departures[0].remaining,0);
 assert.ok(quote.departures.slice(1).every(d=>d.available));
});

test('specified intraday cutoffs and next operational date follow the existing calendar',async()=>{
 for(const [time,index] of [['06:44:00',0],['06:45:00',1],['08:44:00',1],['08:45:00',2],['10:00:00',2],['10:44:00',2],['10:44:59',2],['10:45:00',3],['10:45:01',3],['12:44:00',3],['12:45:00',4]]){
  assert.deepEqual(await at('2026-09-24T'+time+'Z','2026-09-24'),all.slice(index));
 }
 const stamp=(await db.query('select updated_at::text as stamp from service_schedules where id=$1',[schedule])).rows[0].stamp;
 await db.query("select save_schedule_exception_v1($1,$2,$3,'2026-09-25',true,'[]','Closed test day',false,$4)",[op,actor,schedule,stamp]);
 const response=(await db.query('select read_passenger_availability_v1($1,$2,$3,$4) a',[op,product,'2026-09-24',{adult:1,child:0,infant:0}])).rows[0].a;
 assert.equal(response.next_operational_date,'2026-09-26');assert.equal(response.business_date,'2026-09-24');
});
