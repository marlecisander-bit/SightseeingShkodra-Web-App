import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, loadDevelopmentFixtures } from '../helpers/database.mjs';
import { bookingEmailStore, processBookingEmails } from '../../src/modules/integrations/booking-email-worker.ts';
import { bookingEmailConfig } from '../../src/modules/integrations/booking-email-config.ts';
import { bookingEmailTemplate } from '../../src/modules/integrations/booking-email-template.ts';
import { sendResendEmail } from '../../src/modules/integrations/resend-provider.ts';
import { authorizedEmailWorker } from '../../src/modules/integrations/booking-email-server.ts';
const op='10000000-0000-4000-8000-000000000001', other='10000000-0000-4000-8000-000000000002', product='10000000-0000-4000-8000-000000000020';
const staff=randomUUID();
const config={ enabled:true, apiKey:'test-only', from:'Sightseeing Shkodra <bookings@example.invalid>',owner:'owner@example.invalid',replyTo:'reply@example.invalid',testRecipient:'qa@example.invalid',operatorId:op,since:'2020-01-01T00:00:00Z',siteUrl:'https://example.invalid' };
let db,store;
const sent=[],logs=[];
before(async()=>{
 db=await createTestDatabase(); await loadDevelopmentFixtures(db);
 await db.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1250}' where id=$1`,[product]);
 const user=randomUUID();await db.query('insert into auth.users(id) values($1)',[user]);
 await db.query("insert into staff_profiles(id,operator_id,auth_user_id,role) values($1,$2,$3,'owner')",[staff,op,user]);
 store=bookingEmailStore({rpc:async(name,args)=>{
  try {
   const params=Object.entries(args);const rows=(await db.query(`select * from ${name}(${params.map(([k],i)=>`${k} => $${i+1}`).join(',')})`,params.map(([,v])=>v))).rows;
   return {data:['claim_booking_email_v2'].includes(name)?rows:name==='prepare_booking_email_v2'?rows[0]:rows[0]?.[name],error:null};
  }catch(error){return {data:null,error};}
 }});
});
after(async()=>{await db?.close();});
async function create(){
 const dep=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-01-01','09:00',2,'scheduled') returning id",[op,product])).rows[0].id;
 const session='email-session-'+randomUUID();
 const hold=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,dep,session])).rows[0];
 const result=(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Ada Test',$4) b",[op,hold.id,session,randomUUID()+'@example.invalid'])).rows[0].b;
 return (await db.query('select b.*,o.customer_id from bookings b join orders o on o.id=b.order_id where o.id=$1',[result.orderId])).rows[0];
}
const send=async(key,message)=>{sent.push({key,...message});return {outcome:'accepted',reference:randomUUID()};};
const run=()=>processBookingEmails(store,config,send,x=>logs.push(x));
const jobs=async(b)=>(await db.query('select * from notification_deliveries where booking_id=$1 order by created_at,id',[b.id])).rows;

test('successful committed booking sends exactly one customer and one owner email; repeat worker does not resend',async()=>{
 const b=await create();const n=sent.length;await run();await run();
 assert.equal(sent.length-n,2);const j=await jobs(b);assert.equal(j.length,2);assert.deepEqual(j.map(x=>x.recipient_type).sort(),['customer','owner']);assert.ok(j.every(x=>x.status==='accepted'));
 assert.ok(sent.slice(n).every(x=>x.to[0]==='qa@example.invalid'&&x.text.includes('09:00 (Europe/Tirane)')&&x.text.includes('EUR 12.50')));
 assert.ok(sent.slice(n).some(x=>x.text.includes('?booking='+b.id)));
 assert.ok(!JSON.stringify(logs).includes('@example.invalid'));
});
test('meaningful repeated modifications send pairs; no-op retry emits no duplicate; changes in one transaction coalesce',async()=>{
 const b=await create();await run();const n=sent.length;
 await db.query("update customers set name='Updated Guest' where id=$1",[b.customer_id]);await run();
 await db.query("update customers set name='Updated Guest' where id=$1",[b.customer_id]);await run();
 assert.equal(sent.length-n,2);assert.ok(sent.slice(n).every(x=>x.text.includes('Updated Guest')));
 await db.exec('begin');await db.query("update customers set name='Second Guest' where id=$1",[b.customer_id]);await db.query("update customers set phone='+355123' where id=$1",[b.customer_id]);await db.exec('commit');
 await run();assert.equal(sent.length-n,4);
 assert.equal((await jobs(b)).filter(j=>j.event_type==='BOOKING_MODIFIED').length,4);
});
test('cancel retry sends one pair, shows real cancellation and no refund promise; booking remains cancelled',async()=>{
 const b=await create();await run();const n=sent.length;
 for(let i=0;i<2;i++) await db.query('select cancel_order_v1($1,$2,$3,$4)',[op,b.order_id,staff,'Guest requested cancellation']);
 await run();await run();assert.equal(sent.length-n,2);
 assert.ok(sent.slice(n).every(x=>x.subject.includes('Booking Cancelled')&&x.text.includes('Guest requested cancellation')&&x.text.includes('Cancelled at')));
 assert.equal((await db.query('select status from bookings where id=$1',[b.id])).rows[0].status,'cancelled');
});
test('rolled-back mutation emits no event and no email',async()=>{
 const b=await create();await run();const n=sent.length;
 await db.exec('begin');await db.query("update customers set name='Rolled back' where id=$1",[b.customer_id]);await db.exec('rollback');await run();assert.equal(sent.length,n);
});
test('manual resend is idempotent, labelled, rate limited and operator scoped',async()=>{
 const b=await create();await run();const req=randomUUID(),n=sent.length;
 const args=[op,staff,b.id,req];
 await db.query('select request_booking_email_v2($1,$2,$3,$4)',args);await db.query('select request_booking_email_v2($1,$2,$3,$4)',args);
 await assert.rejects(db.query('select request_booking_email_v2($1,$2,$3,$4)',[op,staff,b.id,randomUUID()]),/five minutes/);
 await assert.rejects(db.query('select request_booking_email_v2($1,$2,$3,$4)',[other,staff,b.id,randomUUID()]),/Permission/);
 await run();assert.equal(sent.length-n,2);assert.equal((await jobs(b)).filter(x=>x.manual).length,2);
});
test('provider failure preserves reservation, retry payload and key are identical after booking data changes',async()=>{
 const b=await create();const attempts=new Map();
 await processBookingEmails(store,config,async(key,message)=>{attempts.set(key,{key,...message});return {outcome:'retry',code:'provider_network_uncertain'};},()=>{});
 const j=(await jobs(b)).find(x=>x.recipient_type==='owner');
 await db.query("update notification_deliveries set status='failed' where booking_id=$1 and recipient_type='customer'",[b.id]);
 await db.query("update customers set name='Changed after attempt' where id=$1",[b.customer_id]);
 await db.query('update notification_deliveries set next_attempt_at=clock_timestamp() where id=$1',[j.id]);
 const attempt=attempts.get('booking-email/'+j.id);
 const n=sent.length;await run();const retry=sent.slice(n).find(x=>x.key===attempt.key);assert.deepEqual(retry,attempt);
 assert.equal((await db.query('select status from bookings where id=$1',[b.id])).rows[0].status,'confirmed');
});
test('uncertain sends stop before provider idempotency expires; redaction retains dedupe tombstones',async()=>{
 const b=await create();await store.enqueue(op,config.since);const j=await store.claim(op);await store.prepare(j,{version:1,...config});
 await db.query("update notification_deliveries set lease_until=clock_timestamp()-interval '1 minute',first_send_at=clock_timestamp()-interval '24 hours' where id=$1",[j.id]);
 await run();assert.equal((await jobs(b)).find(x=>x.id===j.id).status,'uncertain');
 // updated_at has a touch trigger; exercise retention with trigger disabled only in isolated fixture DB.
 await db.exec('alter table notification_deliveries disable trigger user');
 await db.query("update notification_deliveries set updated_at=clock_timestamp()-interval '61 days' where booking_id=$1",[b.id]);
 await db.exec('alter table notification_deliveries enable trigger user');
 await store.redact(op);assert.ok((await jobs(b)).every(x=>x.send_snapshot===null&&x.envelope===null));
 const n=sent.length;await run();assert.equal(sent.length,n);assert.equal((await jobs(b)).length,2);
});
test('public roles cannot enqueue, claim, request or mutate email jobs',async()=>{
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{
  for(const sql of ["select enqueue_booking_emails_v2($1,'2020-01-01')","select claim_booking_email_v2($1)","select redact_booking_email_logs_v2($1)"])
   await assert.rejects(db.query(sql,[op]),e=>e.code==='42501');
  await assert.rejects(db.query('select request_booking_email_v2($1,$2,$3,$4)',[op,staff,randomUUID(),randomUUID()]),e=>e.code==='42501');
  await assert.rejects(db.exec("update notification_deliveries set status='accepted'"),e=>e.code==='42501');
 }finally{await db.exec('reset role');}}
});
const booking={reference:'SS-TEST',status:'confirmed',name:'<script>alert(1)</script> & Ada',email:'guest@example.invalid',phone:null,createdAt:'2030-01-01T00:00:00Z',cancelledAt:null,currency:'EUR',total:2500,collectionMode:'meeting_point',paid:false,paymentStatuses:[],refundStatuses:[],refundReview:false,source:'Online',initiatedBy:null,reason:null,items:[{title:'Tour',date:'2030-01-01',time:null,timezone:'Europe/Tirane',guests:2}]};
const envelope={version:1,...config};
test('all six email variants escape malicious content, omit absent optional fields, include plain text',()=>{
 for(const event of ['BOOKING_CREATED','BOOKING_MODIFIED','BOOKING_CANCELLED']) for(const recipient of ['customer','owner']){
  const t=bookingEmailTemplate(event,recipient,booking,envelope,op,randomUUID());assert.ok(t.html.includes('&lt;script&gt;'));assert.ok(!t.html.includes('<script>'));assert.ok(t.text.includes('EUR 25.00'));assert.ok(!t.text.includes('Departure time:'));assert.ok(!t.text.includes('undefined'));assert.ok(!t.text.includes('Customer phone:'));
 }
});
test('missing or malformed customer email skips guest only; owner still receives notification',async()=>{
 for(const email of [null,'invalid','a@b.com\r\nBcc:attacker@evil.com']){
  let pending=[{id:randomUUID(),operator_id:op,booking_id:randomUUID(),booking_reference:'SS-TEST',event_type:'BOOKING_CREATED',recipient_type:'customer',status:'sending',attempt_count:1,send_snapshot:{...booking,email},envelope},{id:randomUUID(),operator_id:op,booking_id:randomUUID(),booking_reference:'SS-TEST',event_type:'BOOKING_CREATED',recipient_type:'owner',status:'sending',attempt_count:1,send_snapshot:{...booking,email},envelope}];const results=[];let calls=0;
  await processBookingEmails({enqueue:async()=>{},redact:async()=>{},claim:async()=>pending.shift(),prepare:async j=>j,finish:async(j,o)=>results.push([j.recipient_type,o])},config,async()=>{calls++;return {outcome:'accepted',reference:'safe-id'};},()=>{});
  assert.equal(calls,1);assert.deepEqual(results,[['customer','skipped'],['owner','accepted']]);
 }
});
test('disabled mode never accesses storage or provider; development requires test address',async()=>{
 assert.deepEqual(bookingEmailConfig({}),{enabled:false});
 const disabled=await processBookingEmails({}, {enabled:false},()=>{throw Error('must not send');},()=>{});assert.equal(disabled.processed,0);
 const env={EMAIL_ENABLED:'true',RESEND_API_KEY:'test',RESEND_FROM_EMAIL:config.from,BOOKING_OWNER_EMAIL:config.owner,BOOKING_REPLY_TO_EMAIL:config.replyTo,PUBLIC_OPERATOR_ID:op,EMAIL_START_AT:config.since,NEXT_PUBLIC_SITE_URL:config.siteUrl};
 assert.throws(()=>bookingEmailConfig(env),/configuration/);assert.equal(bookingEmailConfig({...env,EMAIL_TEST_RECIPIENT:'qa@example.invalid'}).testRecipient,'qa@example.invalid');
 assert.throws(()=>bookingEmailConfig({...env,APP_ENV:'production',VERCEL_ENV:'preview'}));
 assert.equal(authorizedEmailWorker(null),false);assert.equal(authorizedEmailWorker('Bearer '+ 'x'.repeat(32),'x'.repeat(32)),true);assert.equal(authorizedEmailWorker('Bearer wrong','x'.repeat(32)),false);
});
test('Resend acceptance, timeout, outage, API validation and concurrency responses are classified safely',async()=>{
 const message={from:config.from,to:['qa@example.invalid'],reply_to:config.replyTo,subject:'Test',html:'<p>Test</p>',text:'Test'};
 let request;
 const ok=await sendResendEmail('test-secret','same-key',message,async(url,init)=>{request={url,init};return Response.json({id:'provider-id'});});
 assert.equal(ok.outcome,'accepted');assert.equal(request.init.headers['Idempotency-Key'],'same-key');assert.equal(request.url,'https://api.resend.com/emails');assert.ok(request.init.signal);
 for(const [status,name,outcome] of [[500,'internal_server_error','retry'],[429,'rate_limit_exceeded','retry'],[422,'validation_error','failed'],[403,'validation_error','failed'],[409,'concurrent_idempotent_requests','retry'],[409,'invalid_idempotent_request','failed']]){
  const r=await sendResendEmail('secret','same-key',message,async()=>Response.json({name,message:'PII should never be logged'},{status}));assert.equal(r.outcome,outcome);assert.ok(!JSON.stringify(r).includes('PII'));
 }
 const timeout=await sendResendEmail('secret','same-key',message,async()=>{throw new DOMException('timeout','TimeoutError');});assert.equal(timeout.outcome,'retry');
});

test('a cancelled booking is skipped before confirmation attempts, including a saved retry',async()=>{
 const b=await create();await processBookingEmails(store,config,async()=>({outcome:'retry',code:'resend_http_500'}),()=>{});
 await db.query('select cancel_order_v1($1,$2,$3,$4)',[op,b.order_id,staff,'Cancel before retry']);
 await db.query('update notification_deliveries set next_attempt_at=clock_timestamp() where booking_id=$1',[b.id]);
 await run();const j=await jobs(b);assert.ok(j.filter(x=>x.event_type==='BOOKING_CREATED').every(x=>x.status==='skipped'));
 assert.ok(j.filter(x=>x.event_type==='BOOKING_CANCELLED').every(x=>x.status==='accepted'));
});
test('customer booking retries cannot emit another creation event',async()=>{
 const b=await create();await run();const n=sent.length;
 const event=(await db.query("select * from domain_events where aggregate_id=$1 and event_type='booking.confirmed'",[b.id])).rows[0];
 await db.query('select enqueue_domain_event($1,$2,$3,$4,$5,$6,$7)',[op,event.actor_id,event.idempotency_key,event.aggregate_type,event.aggregate_id,event.event_type,event.payload]);
 await run();assert.equal(sent.length,n);assert.equal((await jobs(b)).length,2);
});
test('worker route rejects unauthorized calls before reading bookings or provider configuration',async()=>{
 const {GET}=await import('../../src/app/api/internal/booking-emails/route.ts');
 const result=await GET(new Request('https://example.invalid/api/internal/booking-emails'));
 assert.equal(result.status,401);assert.deepEqual(await result.json(),{error:'Unauthorized'});
});
