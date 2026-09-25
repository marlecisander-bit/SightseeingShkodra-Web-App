import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {quoteAvailability} from '../../src/modules/booking/availability.ts';
let db,actor,product,schedule;
const op='10000000-0000-4000-8000-000000000001';
const times=['09:00','11:00','13:00','15:00'].map(time=>({time}));
async function stamp(){return (await db.query('select updated_at::text as stamp from service_schedules where id=$1',[schedule])).rows[0].stamp;}
async function save(overrides={}) {
  const p={start:'2026-09-24',end:'2026-10-31',days:[1,2,3,4,5,6,7],times,capacity:8,status:'active',actor,product,stamp:schedule?await stamp():null,...overrides};
  return (await db.query('select save_service_schedule_v1($1,$2,$3,$4,$5,$6,$7, $8,null,$9,$10) as id',[op,p.actor,p.product,p.start,p.end,p.days,JSON.stringify(p.times),p.capacity,p.status,p.stamp])).rows[0].id;
}
async function exception(date,overrides={}) {
  const p={closed:false,times:times.filter(t=>t.time!=='09:00'),restore:false,...overrides};
  return db.query('select save_schedule_exception_v1($1,$2,$3,$4,$5,$6,$7,$8,$9)',[op,actor,schedule,date,p.closed,JSON.stringify(p.times),'Test exception',p.restore,await stamp()]);
}
async function snapshot(date){return (await db.query('select read_availability_v1($1,$2,$3) as data',[op,product,date])).rows[0].data;}
before(async()=>{
  db=await createTestDatabase({now:'2026-09-23T00:00:00Z'}); await loadDevelopmentFixtures(db);
  const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
  actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
  product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules) values($1,'van_tour','Hop On Hop Off - Daily Ticket','schedule-test','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1500}','{"version":1,"model":"departure_seats"}') returning id`,[op])).rows[0].id;
});
after(async()=>db?.close());
test('season stores one schedule, materializes only requested dates, reuses departure IDs',async()=>{
  schedule=await save();
  assert.equal((await db.query('select count(*)::int as n from departures where product_id=$1',[product])).rows[0].n,0);
  const first=await snapshot('2026-09-24');
  assert.deepEqual(first.departures.map(d=>d.start_time),['09:00:00','11:00:00','13:00:00','15:00:00']);
  assert.deepEqual((await snapshot('2026-09-24')).departures.map(d=>d.id),first.departures.map(d=>d.id));
  assert.equal((await snapshot('2026-09-26')).departures.length,4);
  assert.equal((await db.query('select count(*)::int as n from departures where product_id=$1',[product])).rows[0].n,8);
  assert.equal((await snapshot('2026-11-01')).departures.length,0);
});
test('date exception cancels only 25 September 09:00 and can be restored',async()=>{
  await snapshot('2026-09-25'); await exception('2026-09-25');
  assert.deepEqual((await snapshot('2026-09-25')).departures.map(d=>d.start_time),['11:00:00','13:00:00','15:00:00']);
  for(const day of ['2026-09-24','2026-09-26']) assert.equal((await snapshot(day)).departures.length,4);
  await exception('2026-09-25',{restore:true}); assert.equal((await snapshot('2026-09-25')).departures.length,4);
});
test('closed days, extra/changed times, per-time capacity, weekdays and paused schedules',async()=>{
  await exception('2026-09-27',{closed:true,times:[]}); assert.equal((await snapshot('2026-09-27')).departures.length,0);
  await exception('2026-09-28',{times:[{time:'10:00',capacity:12},{time:'11:00'},{time:'17:00'}]});
  assert.deepEqual((await snapshot('2026-09-28')).departures.map(d=>[d.start_time,d.capacity]),[['10:00:00',12],['11:00:00',8],['17:00:00',8]]);
  await save({days:[1,2,3,4,5]}); assert.equal((await snapshot('2026-10-03')).departures.length,0);
  await save({status:'paused'}); assert.equal((await snapshot('2026-09-24')).departures.length,0);
  await save(); assert.equal((await snapshot('2026-09-24')).departures.length,4);
});
test('confirmed and active held seats use existing accounting; unsafe edits roll back',async()=>{
  const d=(await snapshot('2026-09-24')).departures[0];
  const session='synthetic-schedule-session-1234567890';
  const hold=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),3)',[op,d.id,session])).rows[0];
  await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Schedule Test','test@example.invalid')",[op,hold.id,session]);
  await db.query('select create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,d.id,session]);
  const quote=quoteAvailability({version:1,operatorId:op,productId:product,date:'2026-09-24',guests:1},await snapshot('2026-09-24'));
  assert.deepEqual(quote.departures.map(d=>d.remaining),[4,8,8,8]);
  await assert.rejects(save({capacity:3}),e=>e.code==='P0001');
  await assert.rejects(exception('2026-09-24',{closed:true,times:[]}),e=>e.code==='P0001');
  await assert.rejects(save({status:'paused'}),e=>e.code==='P0001');
  assert.equal((await snapshot('2026-09-24')).departures[0].capacity,8);
  await assert.rejects(db.query('select create_hold_v1($1,$2,$3,gen_random_uuid(),5)',[op,d.id,session]),e=>e.code==='P0001');
});
test('invalid inputs, stale edits and unauthorized users are rejected',async()=>{
  for(const change of [{start:'2026-11-01'},{days:[]},{days:[1,1]},{times:[]},{times:[{time:'09:00'},{time:'09:00'}]},{capacity:0},{times:[{time:'24:00'}]}]) await assert.rejects(save(change));
  await assert.rejects(exception('2026-11-02'));
  await assert.rejects(save({stamp:'2000-01-01'}),e=>e.code==='PT409');
  await assert.rejects(save({actor:'00000000-0000-4000-8000-000000000001'}),e=>e.code==='42501');
  await db.exec('begin; set local role authenticated');
  try {
    assert.equal((await db.query('select * from service_schedules')).rows.length,0);
    await assert.rejects(db.query('select ensure_schedule_date_v1($1,$2,$3)',[op,product,'2026-10-01']),e=>e.code==='42501');
  } finally {await db.exec('rollback');}
});
test('safe manual inventory adoption preserves IDs and historical records; collisions fail atomically',async()=>{
  const p=(await db.query("insert into products(operator_id,type,title,slug) values($1,'van_tour','Adoption','adoption') returning id",[op])).rows[0].id;
  const past=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2025-01-01','09:00',8,'scheduled') returning id",[op,p])).rows[0].id;
  const future=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2026-09-24','09:00',8,'scheduled') returning id",[op,p])).rows[0].id;
  const adopted=await save({product:p,stamp:null});
  assert.equal((await db.query('select schedule_id from departures where id=$1',[future])).rows[0].schedule_id,adopted);
  assert.equal((await db.query('select schedule_id from departures where id=$1',[past])).rows[0].schedule_id,null);
  await assert.rejects(db.query("select save_departure_v1($1,$2,null,$3,null,'2026-09-24','09:00',8,'scheduled')",[op,actor,p]),e=>e.code==='22023');
  const conflict=(await db.query("insert into products(operator_id,type,title,slug) values($1,'van_tour','Conflict','conflict') returning id",[op])).rows[0].id;
  await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2026-09-24','09:00',9,'scheduled')",[op,conflict]);
  await assert.rejects(save({product:conflict,stamp:null}),e=>e.code==='P0001');
  assert.equal((await db.query('select count(*)::int as n from service_schedules where product_id=$1',[conflict])).rows[0].n,0);
});
