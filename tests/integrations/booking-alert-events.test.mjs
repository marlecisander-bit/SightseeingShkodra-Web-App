import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {bookingEmailStore,processBookingEmails} from '../../src/modules/integrations/booking-email-worker.ts';
import {processPush} from '../../src/modules/notifications/push.ts';
import {adminAlertHeaders} from '../../src/modules/integrations/admin-operational-email.ts';
test('saved creation/modification/cancellation independently send admin email and two device pushes once; provider failures preserve bookings',async()=>{
 const previousVercel=process.env.VERCEL_ENV;process.env.VERCEL_ENV='production';
 const db=await createTestDatabase({now:'2030-06-01T04:00:00Z'});
 try{
 await loadDevelopmentFixtures(db);const op='10000000-0000-4000-8000-000000000001',product='10000000-0000-4000-8000-000000000020';
 await db.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}',passenger_pricing='{"adult":{"min":13,"max":null,"price":1000},"child":{"min":3,"max":12,"price":500},"infant":{"min":0,"max":2,"price":0}}' where id=$1`,[product]);
 const user=randomUUID();await db.query('insert into auth.users values($1)',[user]);await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner')",[op,user]);
 for(const endpoint of ['https://web.push.apple.com/synthetic','https://fcm.googleapis.com/fcm/send/synthetic'])await db.query("insert into admin_push_subscriptions(operator_id,user_id,endpoint,p256dh,auth,device_name) values($1,$2,$3,$4,$5,'Synthetic device')",[op,user,endpoint,'B'.repeat(87),'A'.repeat(22)]);
 // Explicit per-phone origin migration: retire the old installation, preserving two other valid devices.
 await db.query("insert into admin_push_subscriptions(operator_id,user_id,endpoint,p256dh,auth,device_name) values($1,$2,'https://web.push.apple.com/synthetic-old-app',$3,$4,'Former .app installation')",[op,user,'B'.repeat(87),'A'.repeat(22)]);
 await db.query("update admin_push_subscriptions set enabled=false where operator_id=$1 and user_id=$2 and endpoint='https://web.push.apple.com/synthetic-old-app'",[op,user]);
 const depart=async time=>(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-06-01',$3,8,'scheduled') returning id",[op,product,time])).rows[0].id;
 const a=await depart('09:00'),b=await depart('12:00');
 const create=async()=>{const session='synthetic-alert-'+randomUUID();const h=(await db.query('select * from create_passenger_hold_v1($1,$2,$3,$4,1,$5)',[op,a,session,randomUUID(),{adult:1,child:0,infant:0}])).rows[0];return (await db.query("select create_meeting_point_booking_v1($1,$2,$3,'PRIVATE NAME','private@example.invalid') data",[op,h.id,session])).rows[0].data;};
 const rpc=async(name,args)=>{try{const entries=Object.entries(args),rows=(await db.query(`select * from ${name}(${entries.map(([k],i)=>`${k} => $${i+1}`).join(',')})`,entries.map(([,v])=>v))).rows;return {data:name==='claim_booking_email_v2'?rows:name==='prepare_booking_email_v2'?rows[0]:rows[0]?.[name],error:null};}catch(error){return {data:null,error};}};
 const emailStore=bookingEmailStore({rpc});
 const config={enabled:true,apiKey:'synthetic',from:'Sightseeing Shkodra <tickets@sightseeingshkodra.com>',owner:'owner@example.invalid',replyTo:'reply@example.invalid',testRecipient:'qa@example.invalid',operatorId:op,since:'2030-06-01T00:00:00Z',siteUrl:'https://sightseeingshkodra.app'};
 const pushStore={claim:async()=>(await db.query('select * from claim_admin_push_v1($1)',[op])).rows[0]??null,read:async j=>({subscription:(await db.query('select endpoint,p256dh,auth from admin_push_subscriptions where id=$1',[j.subscription_id])).rows[0],notification:(await db.query('select id,title,message,booking_id from admin_notifications where id=$1',[j.notification_id])).rows[0]}),finish:async(j,result,code)=>db.query('select finish_admin_push_v1($1,$2,$3,$4,$5)',[op,j.id,j.lease_token,result,code])};
 const emails=[],pushes=[];const email=()=>processBookingEmails(emailStore,config,async(key,message)=>{emails.push({key,...message});return {outcome:'accepted',reference:randomUUID()};},()=>{});
 const push=async()=>{await db.query("select project_admin_notifications_v1($1,'2030-06-01')",[op]);await processPush(pushStore,async(sub,payload)=>pushes.push(JSON.parse(payload)));};
 const booking=await create(),id=(await db.query('select id from bookings where order_id=$1',[booking.orderId])).rows[0].id;
 for(const [event,heading,mutate] of [
  ['BOOKING_CREATED','New Sightseeing Shkodra booking',async()=>{}],
  ['BOOKING_MODIFIED','Booking modified',async()=>db.query('select modify_customer_booking_v1($1,0,$2,$3,1000,$4)',[booking.managementToken,b,{adult:1,child:0,infant:0},randomUUID()])],
  ['BOOKING_CANCELLED','Booking cancelled',async()=>db.query('select cancel_customer_booking_v1($1)',[booking.managementToken])],
 ]){
  const beforeEmail=emails.length,beforePush=pushes.length;await mutate();await email();await push();await email();await push();
  assert.equal(emails.length-beforeEmail,2,event);assert.equal(pushes.length-beforePush,2,event);
  const pair=emails.slice(beforeEmail),admin=pair.find(x=>x.headers),customer=pair.find(x=>!x.headers);assert(admin);assert(customer);assert.deepEqual(admin.headers,adminAlertHeaders);assert(admin.subject.includes(booking.bookingReference??booking.reference??(await db.query('select booking_reference from bookings where id=$1',[id])).rows[0].booking_reference));assert.equal(customer.headers,undefined);assert(pair.every(m=>m.from===config.from));assert(admin.html.includes('https://www.sightseeingshkodra.com/admin/'));assert(!admin.html.includes('https://sightseeingshkodra.app/admin/'));assert(customer.html.includes('https://sightseeingshkodra.app/'));assert(!customer.html.includes('https://www.sightseeingshkodra.com/booking/manage'));
  for(const item of pushes.slice(beforePush)){assert.equal(item.title,heading);assert.equal(item.url,`/admin/${op}/bookings?booking=${id}`);assert(item.body.includes('SS-'));assert(!item.body.includes('PRIVATE NAME'));assert(!item.body.includes('private@example'));assert(!item.body.includes('token'));}
 }
 assert.equal((await db.query('select status from bookings where id=$1',[id])).rows[0].status,'cancelled');
 const second=await create();await processBookingEmails(emailStore,config,async()=>({outcome:'retry',code:'provider_network_uncertain'}),()=>{});await db.query("select project_admin_notifications_v1($1,'2030-06-01')",[op]);
 let independentPushes=0;await processPush(pushStore,async()=>{independentPushes++;});assert.equal(independentPushes,2);
 const third=await create();let independentEmails=0;await processBookingEmails(emailStore,config,async()=>{independentEmails++;return {outcome:'accepted',reference:randomUUID()};},()=>{});assert.equal(independentEmails,2);
 await db.query("select project_admin_notifications_v1($1,'2030-06-01')",[op]);await processPush(pushStore,async()=>{throw {statusCode:410};});
 for(const order of [second.orderId,third.orderId])assert.equal((await db.query('select status from bookings where order_id=$1',[order])).rows[0].status,'confirmed');assert.equal((await db.query('select count(*)::int n from admin_push_subscriptions where enabled')).rows[0].n,0);
 }finally{await db.close();if(previousVercel===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previousVercel;}
});
