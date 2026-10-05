import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {processPush} from '../../src/modules/notifications/push.ts';
let db,product,owner,other,editor,ownerProfile;
const op='10000000-0000-4000-8000-000000000001',op2='10000000-0000-4000-8000-000000000002',session='admin-notification-test-session-123456789';
before(async()=>{
 db=await createTestDatabase({now:'2030-06-01T06:00:00Z'});await loadDevelopmentFixtures(db);
 for(const [role,tenant,name] of [['owner',op,'owner'],['operations',op,'other'],['content_editor',op,'editor']]){const user=randomUUID();await db.query('insert into auth.users(id) values($1)',[user]);const row=(await db.query('insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,$3) returning id',[tenant,user,role])).rows[0];if(name==='owner'){owner=user;ownerProfile=row.id;}if(name==='other')other=user;if(name==='editor')editor=user;}
 product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules,passenger_pricing) values($1,'van_tour','Notification test','notification-test','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}','{"adult":{"min":13,"max":null,"price":1000},"child":{"min":3,"max":12,"price":500},"infant":{"min":0,"max":2,"price":0}}') returning id`,[op])).rows[0].id;
});after(async()=>db?.close());
async function dep(){return(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-06-01','15:00',8,'scheduled') returning id",[op,product])).rows[0].id;}
async function book(){const d=await dep(),counts={adult:2,child:1,infant:1};const hold=(await db.query('select * from create_passenger_hold_v1($1,$2,$3,$4,4,$5)',[op,d,session,randomUUID(),counts])).rows[0];const b=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Private Name','private@example.invalid') b",[op,hold.id,session])).rows[0].b;const id=(await db.query('select id from bookings where order_id=$1',[b.orderId])).rows[0].id;return {...b,id,departure:d};}
const project=()=>db.query("select project_admin_notifications_v1($1,'2030-06-01') n",[op]);
async function device(user=owner,enabled=true){return(await db.query("insert into admin_push_subscriptions(operator_id,user_id,endpoint,p256dh,auth,device_name,enabled) values($1,$2,$3,$4,$5,'Test device',$6) returning id",[op,user,'https://fcm.googleapis.com/fcm/send/'+randomUUID(),'B'.repeat(87),'A'.repeat(22),enabled])).rows[0].id;}
async function asUser(user,fn){await db.exec('begin;set local role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);try{await fn();}finally{await db.exec('rollback');}}
test('one committed creation projects once with private per-user receipts and multi-device deliveries; email outbox preserved',async()=>{
 const a=await device(),b=await device(),off=await device(owner,false),booking=await book();await project();await project();
 const rows=(await db.query('select * from admin_notifications where booking_id=$1',[booking.id])).rows;assert.equal(rows.length,1);assert.equal(rows[0].type,'booking_created');assert.match(rows[0].message,/4 guests \/ 3 seats/);assert.ok(!rows[0].message.includes('private@example'));assert.ok(!rows[0].message.includes('Private Name'));
 assert.equal((await db.query('select * from admin_notification_receipts where notification_id=$1',[rows[0].id])).rows.length,2);
 const jobs=(await db.query('select subscription_id from admin_push_deliveries where notification_id=$1',[rows[0].id])).rows.map(x=>x.subscription_id);assert.deepEqual(jobs.sort(),[a,b].sort());assert.ok(!jobs.includes(off));
 await db.query("select enqueue_booking_emails_v2($1,'2030-06-01')",[op]);assert.equal((await db.query('select * from notification_deliveries where booking_id=$1 and recipient_type is not null',[booking.id])).rows.length,2);
 assert.equal((await db.query("select count(*)::int n from domain_events where event_type='booking.confirmed' and payload->>'bookingId'=$1",[booking.id])).rows[0].n,1);
});
test('modification and cancellation use existing events once and release adult/child seats only',async()=>{
 const b=await book(),destination=await dep();await project();await db.query('select modify_customer_booking_v1($1,0,$2,$3,2500,$4)',[b.managementToken,destination,{adult:2,child:1,infant:2},randomUUID()]);await project();await project();
 assert.equal((await db.query("select * from admin_notifications where booking_id=$1 and type='booking_modified'",[b.id])).rows.length,1);
 assert.equal(Number((await db.query("select sum(occupied_seats) n from booking_items where order_id=$1 and status='confirmed'",[b.orderId])).rows[0].n),3);
 await db.query('select cancel_customer_booking_v1($1)',[b.managementToken]);await project();await project();
 assert.equal((await db.query("select * from admin_notifications where booking_id=$1 and type='booking_cancelled'",[b.id])).rows.length,1);
 assert.equal((await db.query("select * from booking_items where order_id=$1 and status='confirmed'",[b.orderId])).rows.length,0);
});
test('payment collection and failed email project operational alerts without exposing provider payloads',async()=>{
 const b=await book();await db.query('select collect_meeting_point_payment_v1($1,$2,$3)',[op,b.orderId,ownerProfile]);await project();assert.equal((await db.query("select * from admin_notifications where booking_id=$1 and type='payment_status_changed'",[b.id])).rows.length,1);
 await db.query("select enqueue_booking_emails_v2($1,'2030-06-01')",[op]);await db.query("update notification_deliveries set status='failed' where booking_id=$1 and recipient_type='owner'",[b.id]);await project();await project();assert.equal((await db.query("select * from admin_notifications where booking_id=$1 and type='email_delivery_failed'",[b.id])).rows.length,1);
});
test('RLS isolates recipients, roles and operators; browser cannot forge records or read device secrets',async()=>{
 await asUser(owner,async()=>{const r=await db.query('select user_id from admin_notification_receipts');assert.ok(r.rows.length);assert.ok(r.rows.every(x=>x.user_id===owner));assert.ok((await db.query('select * from admin_notifications')).rows.length);});
 await asUser(editor,async()=>{assert.equal((await db.query('select * from admin_notifications')).rows.length,0);assert.equal((await db.query('select * from admin_notification_receipts')).rows.length,0);});
 const outsider=randomUUID();await db.query('insert into auth.users(id) values($1)',[outsider]);await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner')",[op2,outsider]);await asUser(outsider,async()=>{assert.equal((await db.query('select * from admin_notifications')).rows.length,0);});
 for(const table of ['admin_notifications','admin_notification_receipts','admin_notification_preferences','admin_push_subscriptions','admin_push_deliveries','admin_notification_sources']){assert.equal((await db.query("select has_table_privilege('authenticated',$1,'INSERT,UPDATE,DELETE,TRUNCATE') allowed",[table])).rows[0].allowed,false);}
 await asUser(owner,async()=>{await assert.rejects(db.query('select * from admin_push_subscriptions'),e=>e.code==='42501');});
 await db.exec('begin;set local role anon');try{await assert.rejects(db.query('select * from admin_notifications'),e=>e.code==='42501');}finally{await db.exec('rollback');}
});
test('read state is per user and preferences suppress future receipts/push independently',async()=>{
 const b=await book();await project();const n=(await db.query('select id from admin_notifications where booking_id=$1',[b.id])).rows[0].id;
 await db.query('update admin_notification_receipts set read_at=clock_timestamp() where notification_id=$1 and user_id=$2',[n,owner]);assert.equal((await db.query('select read_at from admin_notification_receipts where notification_id=$1 and user_id=$2',[n,other])).rows[0].read_at,null);
 await db.query("insert into admin_notification_preferences(operator_id,user_id,type,in_app,push) values($1,$2,'booking_created',false,false)",[op,owner]);const fresh=await book();await project();const id=(await db.query('select id from admin_notifications where booking_id=$1',[fresh.id])).rows[0].id;
 assert.equal((await db.query('select visible from admin_notification_receipts where notification_id=$1 and user_id=$2',[id,owner])).rows[0].visible,false);assert.equal((await db.query('select d.id from admin_push_deliveries d join admin_push_subscriptions s on s.id=d.subscription_id where d.notification_id=$1 and s.user_id=$2',[id,owner])).rows.length,0);
});
test('push failures and expired subscriptions never undo bookings; retries bounded and stale leases uncertain',async()=>{
 await db.query('delete from admin_push_deliveries');await db.query('delete from admin_notification_preferences');const b=await book();await project();
 const claim=async()=>(await db.query('select * from claim_admin_push_v1($1)',[op])).rows[0];let j=await claim();assert.ok(j);await db.query("select finish_admin_push_v1($1,$2,$3,'expired','subscription_expired')",[op,j.id,j.lease_token]);assert.equal((await db.query('select enabled from admin_push_subscriptions where id=$1',[j.subscription_id])).rows[0].enabled,false);
 j=await claim();assert.ok(j);await db.query("update admin_push_deliveries set leased_at=clock_timestamp()-interval '3 minutes' where id=$1",[j.id]);await claim();assert.equal((await db.query('select status from admin_push_deliveries where id=$1',[j.id])).rows[0].status,'uncertain');await assert.rejects(db.query("select finish_admin_push_v1($1,$2,$3,'accepted','accepted')",[op,j.id,j.lease_token]),/Stale/);
 assert.equal((await db.query('select status from bookings where id=$1',[b.id])).rows[0].status,'confirmed');
});

test('committed booking reaches two devices through the real projector, claims and completion store',async()=>{
 await db.query('delete from admin_push_deliveries');await db.query('update admin_push_subscriptions set enabled=false');
 const devices=[await device(),await device()],b=await book();await project();const sent=[];
 const store={
  claim:async()=>(await db.query('select * from claim_admin_push_v1($1)',[op])).rows[0]??null,
  read:async j=>({subscription:(await db.query('select endpoint,p256dh,auth from admin_push_subscriptions where id=$1',[j.subscription_id])).rows[0],notification:(await db.query('select id,title,message,booking_id from admin_notifications where id=$1',[j.notification_id])).rows[0]}),
  finish:async(j,result,code)=>db.query('select finish_admin_push_v1($1,$2,$3,$4,$5)',[op,j.id,j.lease_token,result,code]),
 };
 assert.equal(await processPush(store,async(sub,payload)=>sent.push({sub,payload:JSON.parse(payload)})),2);
 assert.equal(sent.length,2);assert.notEqual(sent[0].sub.endpoint,sent[1].sub.endpoint);assert.equal(sent[0].payload.url,`/admin/${op}/bookings?booking=${b.id}`);
 assert.equal((await db.query("select count(*)::int n from admin_push_deliveries where status='accepted' and subscription_id=any($1::uuid[])",[devices])).rows[0].n,2);
 await project();assert.equal(await processPush(store,async()=>assert.fail('Duplicate push')),0);
 assert.equal((await db.query('select status from bookings where id=$1',[b.id])).rows[0].status,'confirmed');
});

test('temporary rejection stops after five attempts and revoked membership prevents queued delivery',async()=>{
 await db.query('delete from admin_push_deliveries');await db.query('update admin_push_subscriptions set enabled=false');await device();await book();await project();
 for(let attempt=1;attempt<=5;attempt++){
  const j=(await db.query('select * from claim_admin_push_v1($1)',[op])).rows[0];assert.equal(j.attempts,attempt);
  await db.query("select finish_admin_push_v1($1,$2,$3,'retry','provider_temporary')",[op,j.id,j.lease_token]);
  assert.equal((await db.query('select status from admin_push_deliveries where id=$1',[j.id])).rows[0].status,attempt===5?'failed':'pending');
  await db.query("update admin_push_deliveries set next_attempt_at='2000-01-01' where id=$1",[j.id]);
 }
 assert.equal((await db.query('select * from claim_admin_push_v1($1)',[op])).rows.length,0);
 await book();await project();await db.query('update staff_profiles set is_active=false where auth_user_id=$1',[owner]);
 assert.equal((await db.query('select * from claim_admin_push_v1($1)',[op])).rows.length,0);
 assert.ok((await db.query("select * from admin_push_deliveries where status='skipped'")).rows.length);
 await db.query('update staff_profiles set is_active=true where auth_user_id=$1',[owner]);
});
