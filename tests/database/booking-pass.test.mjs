import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
let db,actor,dep,legacy=[],fresh;
const op='10000000-0000-4000-8000-000000000001',product='10000000-0000-4000-8000-000000000020';
const dir=new URL('../../supabase/migrations/',import.meta.url),migration='20260924000100_booking_qr_pass.sql';
async function create(index){
 const session='qr-pass-test-session-'+index+'-1234567890123456';
 const h=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,dep,session])).rows[0];
 const result=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'QR Test','qr-test@example.invalid') as data",[op,h.id,session])).rows[0].data;
 return {result,hold:h,session};
}
async function booking(orderId){return (await db.query('select * from bookings where order_id=$1',[orderId])).rows[0];}
async function scan(token,check=false,operator=op,staff=actor){return (await db.query('select resolve_booking_pass_v1($1,$2,$3,$4) as data',[operator,staff,token,check])).rows[0].data;}
before(async()=>{
 db=new PGlite();await db.exec(platformSql);
 for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f!==migration).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 await loadDevelopmentFixtures(db);
 const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'operations') returning id",[op,user])).rows[0].id;
 await db.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1250}' where id=$1`,[product]);
 dep=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2031-09-25','15:00',8,'scheduled') returning id",[op,product])).rows[0].id;
 for(let i=0;i<3;i++)legacy.push(await create(i));
 await db.query('select cancel_order_v1($1,$2,$3,$4)',[op,legacy[2].result.orderId,actor,'Test prior cancellation']);
 await db.exec(await readFile(new URL(migration,dir),'utf8'));
});
after(async()=>db?.close());
test('backfill gives every previously confirmed booking a distinct credential, including cancellations',async()=>{
 const rows=await Promise.all(legacy.map(x=>booking(x.result.orderId)));
 assert.equal(new Set(rows.map(b=>b.qr_token)).size,3);
 for(const b of rows){assert.match(b.qr_token,/^[0-9a-f]{64}$/);assert.ok(b.qr_created_at);assert.equal(b.checked_in_at,null);assert.ok(b.booking_reference.startsWith('SS-'));}
 assert.equal((await scan(rows[2].qr_token)).status,'CANCELLED');
});
test('new confirmation issues QR atomically; idempotent replay and reread preserve it and price/guests',async()=>{
 fresh=await create(4);const b=await booking(fresh.result.orderId);
 assert.match(b.qr_token,/^[0-9a-f]{64}$/);assert.equal(fresh.result.total,1250);assert.equal(fresh.result.items[0].quantity,1);
 await db.query("select create_meeting_point_booking_v1($1,$2,$3,'QR Test','qr-test@example.invalid')",[op,fresh.hold.id,fresh.session]);
 assert.equal((await booking(fresh.result.orderId)).qr_token,b.qr_token);
 assert.equal((await scan(b.qr_token)).bookingId,b.id);
 const before=(await db.query('select count(*)::int n from bookings')).rows[0].n;
 const hold=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,dep,'qr-invalid-session-12345678901234'])).rows[0];
 await assert.rejects(db.query("select create_meeting_point_booking_v1($1,$2,$3,'QR Test','bad-email')",[op,hold.id,'qr-invalid-session-12345678901234']));
 assert.equal((await db.query('select count(*)::int n from bookings')).rows[0].n,before);
});
test('credentials are immutable and uniquely constrained even if privileged trigger bypass is attempted',async()=>{
 const a=await booking(legacy[0].result.orderId),b=await booking(legacy[1].result.orderId);
 await assert.rejects(db.query('update bookings set qr_token=$1 where id=$2',[a.qr_token,b.id]),e=>e.code==='23514');
 await db.exec('begin; alter table bookings disable trigger guard_booking_pass');
 try{await assert.rejects(db.query('update bookings set qr_token=$1 where id=$2',[a.qr_token,b.id]),e=>e.code==='23505');}finally{await db.exec('rollback');}
});
test('lookup is tenant/role restricted and public roles cannot resolve or read tokens',async()=>{
 const b=await booking(legacy[0].result.orderId);
 assert.equal((await scan('0'.repeat(64))).status,'INVALID');
 await assert.rejects(scan(b.qr_token,false,'20000000-0000-4000-8000-000000000001'),e=>e.code==='42501');
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);
  try{await assert.rejects(scan(b.qr_token),e=>e.code==='42501');if(role==='anon')await assert.rejects(db.query('select qr_token from bookings'),e=>e.code==='42501');else assert.equal((await db.query('select qr_token from bookings')).rows.length,0);}finally{await db.exec('reset role');}
 }
});
test('first check-in succeeds once, duplicate reports original time, cancellation retains credential',async()=>{
 const b=await booking(fresh.result.orderId),first=await scan(b.qr_token,true),second=await scan(b.qr_token,true);
 assert.equal(first.status,'CHECKED_IN');assert.equal(second.status,'ALREADY_CHECKED_IN');assert.equal(first.checkedInAt,second.checkedInAt);
 assert.equal((await booking(fresh.result.orderId)).checked_in_by,actor);
 await db.query('select cancel_order_v1($1,$2,$3,$4)',[op,fresh.result.orderId,actor,'Regression cancellation']);
 assert.equal((await scan(b.qr_token,true)).status,'CANCELLED');assert.equal((await booking(fresh.result.orderId)).qr_token,b.qr_token);
});
