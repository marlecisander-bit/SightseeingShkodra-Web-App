import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createTestDatabase,loadDevelopmentFixtures,setTestClock} from '../helpers/database.mjs';
let db,actor,source,loop,day,schedule;
const op='10000000-0000-4000-8000-000000000001',van='10000000-0000-4000-8000-000000000030',session='shared-van-tests-session-1234567890123456';
const counts=n=>({adult:n,child:0,infant:0});
async function product(title){return (await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules,passenger_pricing) values($1,'van_tour',$2,gen_random_uuid()::text,'published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}','{"adult":{"min":13,"max":null,"price":1000},"child":{"min":3,"max":12,"price":500},"infant":{"min":0,"max":2,"price":0}}') returning id`,[op,title])).rows[0].id;}
async function configure(id,mode='selected_departure',src=source){const stamp=(await db.query('select updated_at from products where id=$1',[id])).rows[0].updated_at;await db.query('select save_product_booking_v1($1,$2,$3,$4,$5,120,$6)',[op,actor,id,src,mode,stamp]);}
async function availability(id,date){return (await db.query('select read_passenger_availability_v1($1,$2,$3,$4) data',[op,id,date,counts(1)])).rows[0].data;}
async function hold(id,dep,n=1,request=randomUUID()){return (await db.query('select * from create_product_hold_v1($1,$2,$3,$4,$5,$6,$7)',[op,dep,session,request,n,counts(n),id])).rows[0];}
async function book(id,dep,n=1){const h=await hold(id,dep,n);return (await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Synthetic','synthetic@example.invalid') data",[op,h.id,session])).rows[0].data;}
before(async()=>{
 db=await createTestDatabase({now:'2030-06-10T04:00:00Z'});await loadDevelopmentFixtures(db);
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,uid])).rows[0].id;
 source=await product('Hop On Hop Off');loop=await product('Loop');day=await product('Day');
 await db.query(`select save_service_schedule_v1($1,$2,$3,'2030-06-10','2030-06-30',array[1,2,3,4,5,6,7],'[{"time":"09:00"},{"time":"10:00"},{"time":"11:00"},{"time":"13:00"}]',8,$4,'active',null)`,[op,actor,source,van]);
 schedule=(await db.query('select id from service_schedules where product_id=$1',[source])).rows[0].id;
 await configure(loop);await configure(day,'whole_day');
});
after(async()=>db?.close());
test('two offers share departures and overlapping physical occupancy, own prices and identity',async()=>{
 const a=await availability(source,'2030-06-10'),b=await availability(loop,'2030-06-10');assert.deepEqual(a.departures.map(d=>d.id),b.departures.map(d=>d.id));
 await db.query("update products set passenger_pricing=jsonb_set(passenger_pricing,'{adult,price}','1200'),pricing_rules=jsonb_set(pricing_rules,'{unit_price}','1200') where id=$1",[loop]);
 const booking=await book(loop,a.departures[0].id,7);
 assert.equal(booking.total,8400);assert.equal(booking.items[0].reservationSnapshot.mode,'selected_departure');
 await db.query("update products set passenger_pricing=jsonb_set(passenger_pricing,'{adult,price}','1000'),pricing_rules=jsonb_set(pricing_rules,'{unit_price}','1000') where id=$1",[loop]);
 assert.equal(booking.items[0].productId,loop);
 const after=await availability(source,'2030-06-10');assert.equal(after.departures[0].committed,7);assert.equal(after.departures[1].committed,7);assert.equal(after.departures[2].committed,0);
 await assert.rejects(hold(source,a.departures[1].id,2),/capacity/);
 await book(source,a.departures[2].id,8);
});
test('whole-day checks peak occupancy rather than summing disjoint trips; cancellation frees every slot',async()=>{
 const a=await availability(source,'2030-06-11');await book(loop,a.departures[0].id,4);await book(loop,a.departures[2].id,4);
 const all=await availability(day,'2030-06-11');assert.equal(all.departures[0].committed,4);
 const booking=await book(day,a.departures[0].id,4);
 for(const dep of (await availability(loop,'2030-06-11')).departures)assert.equal(dep.committed+dep.held>=4,true);
 await assert.rejects(hold(loop,a.departures[1].id,1),/capacity/);
 await db.query('select cancel_customer_booking_v1($1)',[booking.managementToken]);
 assert.equal((await availability(loop,'2030-06-11')).departures[3].committed,0);
});
test('policy edits affect new reservations only, including customer modification',async()=>{
 const a=await availability(source,'2030-06-12');const booking=await book(loop,a.departures[0].id,1);await configure(loop,'whole_day');
 const old=(await db.query('select reservation_snapshot from booking_items where order_id=$1',[booking.orderId])).rows[0].reservation_snapshot;assert.equal(old.mode,'selected_departure');
 await db.query('select modify_customer_booking_v1($1,0,$2,$3,1000,$4)',[booking.managementToken,a.departures[2].id,counts(1),randomUUID()]);
 assert.equal((await db.query('select reservation_snapshot from booking_items where order_id=$1',[booking.orderId])).rows[0].reservation_snapshot.mode,'selected_departure');
 const h=await hold(loop,a.departures[3].id);assert.equal(h.reservation_snapshot.mode,'whole_day');
 await configure(loop);
});
test('idempotency binds offer identity; expired/released holds no longer occupy shared seats',async()=>{
 const a=await availability(source,'2030-06-13');const request=randomUUID();const h=await hold(loop,a.departures[0].id,8,request);assert.equal((await hold(loop,a.departures[0].id,8,request)).id,h.id);
 await assert.rejects(hold(source,a.departures[0].id,8,request),/Conflicting/);
 await assert.rejects(hold(source,a.departures[1].id),/capacity/);
 await db.query('select manage_hold_v1($1,$2,$3,true)',[op,h.id,session]);await hold(source,a.departures[1].id,8);
 await setTestClock(db,'2030-06-10T04:11:00Z');await hold(loop,a.departures[0].id,8);
});
test('admin configuration guards tenant, source chains, existing inventory and stale edits',async()=>{
 await assert.rejects(configure(source,'selected_departure',loop),/existing vehicle schedule/);
 const bad=randomUUID();await assert.rejects(configure(loop,'selected_departure',bad),/existing vehicle schedule/);
 await assert.rejects(db.query('select save_product_booking_v1($1,$2,$3,$4,\'whole_day\',120,\'2000-01-01\')',[op,actor,loop,source]),/changed/);
 await assert.rejects(db.query(`insert into service_schedules(operator_id,product_id,start_date,end_date,weekdays,departure_times,default_capacity,status) values($1,$2,'2030-06-10','2030-06-30',array[1],'[{"time":"09:00"}]',8,'active')`,[op,loop]),/linked inventory/);
 await assert.rejects(db.query('select save_calendar_override_v1($1,$2,$3,\'2030-06-11\',\'2030-06-11\',array[1,2,3,4,5,6,7],\'{"capacity":1}\',false,$4,false)',[op,actor,schedule,(await db.query('select updated_at from service_schedules where id=$1',[schedule])).rows[0].updated_at]),/capacity/i);
});
test('card draft/publish and booking directory are tenant-scoped; browser roles cannot invoke new RPCs',async()=>{
 const card={description:'One loop',image:'/images/lake.webp',alt:'Lake',enabled:true,order:2};
 let stamp=(await db.query('select updated_at from products where id=$1',[loop])).rows[0].updated_at;
 await db.query('select save_product_card_v1($1,$2,$3,$4,$5,false)',[op,actor,loop,stamp,card]);
 let directory=(await db.query('select read_public_products_v1($1) data',[op])).rows[0].data;assert.equal(directory.find(p=>p.id===loop).card,null);
 stamp=(await db.query('select updated_at from products where id=$1',[loop])).rows[0].updated_at;
 await db.query('select save_product_card_v1($1,$2,$3,$4,$5,true)',[op,actor,loop,stamp,card]);directory=(await db.query('select read_public_products_v1($1) data',[op])).rows[0].data;assert.equal(directory.find(p=>p.id===loop).card.description,'One loop');
 assert.deepEqual((await db.query('select read_public_products_v1($1) data',['10000000-0000-4000-8000-000000000002'])).rows[0].data,[]);
 for(const role of ['anon','authenticated']){await db.exec('begin;set local role '+role);try{await assert.rejects(db.query('select read_public_products_v1($1)',[op]),e=>e.code==='42501');}finally{await db.exec('rollback');}}
});

test('pending holds preserve their policy through confirmation; staff bookings retain purchased offer identity',async()=>{
 const a=await availability(source,'2030-06-14');const h=await hold(loop,a.departures[0].id,2);await configure(loop,'whole_day');
 const booking=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Synthetic','synthetic@example.invalid') data",[op,h.id,session])).rows[0].data;
 assert.equal(booking.items[0].reservationSnapshot.mode,'selected_departure');
 await configure(loop);
 const staff=(await db.query("select create_staff_product_booking_v1($1,$2,$3,$4,1,'Synthetic','synthetic@example.invalid',null,$5,$6) data",[op,actor,a.departures[3].id,randomUUID(),counts(1),loop])).rows[0].data;
 assert.equal((await db.query('select product_id from booking_items where order_id=$1',[staff.orderId])).rows[0].product_id,loop);
 const calendar=(await db.query("select read_operations_calendar_v1($1,$2,$3,'2030-06-01') data",[op,actor,schedule])).rows[0].data;
 assert.equal(calendar.days.find(d=>d.date==='2030-06-14').slots[1].booked,2);
});
test('whole-day reservations constrain added slots, vehicle changes and seasonal time boundaries',async()=>{
 const a=await availability(source,'2030-06-15');await book(day,a.departures[0].id,7);
 const stamp=(await db.query('select updated_at::text stamp from service_schedules where id=$1',[schedule])).rows[0].stamp;
 await assert.rejects(db.query("select save_calendar_override_v1($1,$2,$3,'2030-06-15','2030-06-15',array[1,2,3,4,5,6,7],'{\"departures\":{\"13:00\":{\"closed\":true}}}',false,$4,false)",[op,actor,schedule,stamp]),e=>e.code==='PT428');
 await assert.rejects(db.query("insert into departures(operator_id,product_id,vehicle_id,service_date,start_time,capacity,status) values($1,$2,$3,'2030-06-15','15:00',6,'scheduled')",[op,source,van]),/capacity/i);
 await assert.rejects(db.query("update departures set vehicle_id=null where id=$1",[a.departures[3].id]),/preserving the service vehicle/);
 for(const [date,hours]of [['2030-03-31',23],['2030-10-27',25]]){
  const d=(await db.query("insert into departures(operator_id,product_id,vehicle_id,service_date,start_time,capacity,status) values($1,$2,$3,$4,'13:00',8,'scheduled') returning id",[op,source,van,date])).rows[0];
  const w=(await db.query('select reservation_window_v1($1,$2) w',[day,d.id])).rows[0].w;assert.equal((Date.parse(w.end)-Date.parse(w.start))/3600000,hours);
 }
});

test('unpublished inventory and foreign offers fail closed; content editors cannot change operations or publish cards',async()=>{
 const a=await availability(source,'2030-06-16');
 await assert.rejects(hold('10000000-0000-4000-8000-000000000021',a.departures[0].id),e=>e.code==='P0002');
 await assert.rejects(db.query("insert into inventory_holds(operator_id,departure_id,product_id,session_key,quantity,expires_at,reservation_snapshot) values($1,$2,'10000000-0000-4000-8000-000000000021',$3,1,'2031-06-01'::timestamptz,'{}')",[op,a.departures[0].id,session]),e=>e.code==='23503');
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const editor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'content_editor') returning id",[op,uid])).rows[0].id;
 let stamp=(await db.query('select updated_at from products where id=$1',[loop])).rows[0].updated_at;
 await assert.rejects(db.query('select save_product_booking_v1($1,$2,$3,$4,\'whole_day\',120,$5)',[op,editor,loop,source,stamp]),e=>e.code==='42501');
 const card={description:'Draft',image:'/images/lake.webp',alt:'Lake',enabled:true,order:1};
 await db.query('select save_product_card_v1($1,$2,$3,$4,$5,false)',[op,editor,loop,stamp,card]);stamp=(await db.query('select updated_at from products where id=$1',[loop])).rows[0].updated_at;
 await assert.rejects(db.query('select save_product_card_v1($1,$2,$3,$4,$5,true)',[op,editor,loop,stamp,card]),e=>e.code==='42501');
 await assert.rejects(db.query('select save_product_card_v1($1,$2,$3,$4,$5,false)',[op,actor,loop,stamp,{...card,image:'javascript:alert(1)'}]),e=>e.code==='22023');
 await db.query("update products set status='draft' where id=$1",[source]);
 assert.equal((await db.query('select read_public_products_v1($1) data',[op])).rows[0].data.some(p=>p.id===loop),false);
 await db.query("update products set status='published' where id=$1",[source]);
});

test('existing selected-trip self-service uses its snapshot even when future whole-day sales require a different vehicle policy',async()=>{
 const old=(await availability(source,'2030-06-18')).departures;const booking=await book(loop,old[0].id);
 const targets=(await availability(source,'2030-06-19')).departures;
 const other=(await db.query("insert into vehicles(operator_id,name) values($1,'Synthetic replacement') returning id",[op])).rows[0].id;
 await db.query('update departures set vehicle_id=$1 where id=$2',[other,targets[3].id]);await configure(loop,'whole_day');
 await assert.rejects(availability(loop,'2030-06-19'),/consistent vehicle/);
 const managed=(await db.query('select customer_booking_availability_v1($1,$2,$3) data',[booking.managementToken,'2030-06-19',counts(1)])).rows[0].data;assert.equal(managed.departures.length,4);assert.equal(managed.product_id,loop);
 await db.query('select modify_customer_booking_v1($1,0,$2,$3,1000,$4)',[booking.managementToken,targets[3].id,counts(1),randomUUID()]);
 assert.equal((await db.query('select reservation_snapshot from booking_items where order_id=$1',[booking.orderId])).rows[0].reservation_snapshot.mode,'selected_departure');await configure(loop);
});
