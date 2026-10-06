import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emailAdminStatus, deliveryLabel, deliveryGroups } from '../../src/modules/integrations/email-admin-status.ts';
import { sendAdminTestEmail } from '../../src/modules/integrations/email-admin-test.ts';
import { authorizeStaff } from '../../src/modules/identity/authorization.ts';
import { navigationFor } from '../../src/modules/identity/admin-navigation.ts';
import { getEmailAdmin } from '../../src/modules/integrations/email-admin-server.ts';

const op='10000000-0000-4000-8000-000000000001';
const env={EMAIL_ENABLED:'false',RESEND_API_KEY:'secret-api-sentinel',CRON_SECRET:'secret-cron-sentinel'.repeat(3),SUPABASE_SECRET_KEY:'secret-service-sentinel',RESEND_FROM_EMAIL:'Sightseeing <sender@example.invalid>',BOOKING_OWNER_EMAIL:'owner@example.invalid',BOOKING_REPLY_TO_EMAIL:'reply@example.invalid',EMAIL_TEST_RECIPIENT:'qa@example.invalid',EMAIL_START_AT:'2026-09-25T00:00:00Z',PUBLIC_OPERATOR_ID:op,NEXT_PUBLIC_SITE_URL:'https://example.invalid',APP_ENV:'development'};
const membership={id:'staff',operator_id:op,auth_user_id:'user',role:'owner',is_active:true};
const authorize=(id,p)=>authorizeStaff({getVerifiedUser:async()=>({id:'user'}),getMembership:async()=>membership},id,p);
test('safe status distinguishes readiness from enablement and never returns secrets',()=>{
  const result=emailAdminStatus(op,env);
  assert.equal(result.enabled,false);assert.equal(result.ready,true);assert.equal(result.cronConfigured,true);
  const serialized=JSON.stringify(result);
  for(const value of [env.RESEND_API_KEY,env.CRON_SECRET,env.SUPABASE_SECRET_KEY])assert(!serialized.includes(value));
  assert.equal(emailAdminStatus(op,{}).ready,false);
  assert.equal(emailAdminStatus('other',env).senderEmail,'');
  assert.equal(emailAdminStatus('other',env).apiKeyConfigured,false);
});
test('integration workspace remains owner-only',()=>{
  assert(navigationFor('owner').some(n=>n.slug==='email'));
  for(const role of ['admin','operations','content_editor'])assert(!navigationFor(role).some(n=>n.slug==='email'));
});
test('test email authenticates before accessing configuration or provider',async()=>{
  let sent=false,read=false;
  const dependencies={authorize:async()=>{throw Error('denied');},send:async()=>{sent=true;},get env(){read=true;return env;},now:()=>0};
  await assert.rejects(sendAdminTestEmail(op,'qa@example.invalid',dependencies));
  assert.equal(sent,false);assert.equal(read,false);
});
test('authorized synthetic test works while automatic delivery stays disabled and retries reuse identity',async()=>{
  const calls=[];const dependencies={authorize,env,now:()=>120000,send:async(...args)=>{calls.push(args);return {outcome:'accepted'};}};
  await sendAdminTestEmail(op,'qa@example.invalid',dependencies);
  await sendAdminTestEmail(op,'qa@example.invalid',dependencies);
  assert.equal(calls.length,2);assert.equal(calls[0][1],calls[1][1]);
  assert.deepEqual(calls[0][2].to,['qa@example.invalid']);assert(calls[0][2].subject.includes('[TEST]'));
  assert(!JSON.stringify(calls[0][2]).includes(env.RESEND_API_KEY));assert.equal(env.EMAIL_ENABLED,'false');
});
test('test recipient and operator cannot be substituted and provider failures propagate without success',async()=>{
  let sent=false;const dependencies={authorize,env,now:()=>0,send:async()=>{sent=true;return {outcome:'failed'};}};
  await assert.rejects(sendAdminTestEmail(op,'victim@example.invalid',dependencies));assert.equal(sent,false);
  await assert.rejects(sendAdminTestEmail('10000000-0000-4000-8000-000000000002','qa@example.invalid',dependencies));assert.equal(sent,false);
  await assert.rejects(sendAdminTestEmail(op,'qa@example.invalid',dependencies),/test_unavailable/);assert.equal(sent,true);
});
test('delivery filters cover actual queue states without implying inbox delivery',()=>{
  assert.deepEqual(deliveryGroups.pending,['pending','leased','sending','retry']);
  assert.deepEqual(deliveryGroups.failed,['failed','uncertain']);
  assert.match(deliveryLabel('accepted'),/provider accepted/);
  assert.match(deliveryLabel('uncertain'),/review before resending/);
  assert.equal(deliveryLabel('skipped'),'Skipped');
});
test('history scopes every query, excludes legacy deliveries and offers resend only for confirmed bookings',async()=>{
  const rows=[
    {id:'a',operator_id:op,booking_id:'b',recipient_type:'customer',status:'failed',event_type:'BOOKING_CREATED',updated_at:'2026-09-25T00:00:00Z'},
    {id:'c',operator_id:op,booking_id:'d',recipient_type:'owner',status:'accepted',event_type:'BOOKING_CANCELLED',updated_at:'2026-09-25T00:00:00Z'},
    {id:'legacy',operator_id:op,booking_id:'b',recipient_type:null,status:'pending'},
    {id:'other',operator_id:'other',booking_id:'b',recipient_type:'customer',status:'failed'},
  ];
  const client={from(table){let data=table==='bookings'?[{id:'b',operator_id:op,status:'confirmed'}]:[...rows],count=false;return {
    maybeSingle(){return Promise.resolve({data:null,error:null});},select(_fields,opts){count=Boolean(opts?.count);return this;},eq(k,v){data=data.filter(r=>r[k]===v);return this;},in(k,v){data=data.filter(r=>v.includes(r[k]));return this;},order(){return this;},limit(n){data=data.slice(0,n);return this;},then(resolve){return Promise.resolve({data,count:count?data.length:null,error:null}).then(resolve);},
  };}};
  const result=await getEmailAdmin(op,'failed','customer',async(id,permission,operation)=>{assert.equal(id,op);assert.equal(permission,'integrations.manage');return operation(client,{operatorId:op});});
  assert.deepEqual(result.rows.map(r=>r.id),['a']);assert.deepEqual(result.resendable,['b']);assert.equal(result.pending,0);
  assert.equal(result.events[0].failed,1);assert.equal(result.events[2].sent,1);
});
test('history authorization failure cannot enter the database callback',async()=>{
  await assert.rejects(getEmailAdmin(op,undefined,undefined,async()=>{throw Error('denied');}),/denied/);
});

test('owner test uses owner template through same adapter and approved recipient only',async()=>{
 const sent=[];await sendAdminTestEmail(op,'qa@example.invalid',{authorize,env,now:()=>0,send:async(...args)=>{sent.push(args);return {outcome:'accepted'};}},'owner');
 assert.deepEqual(sent[0][2].to,['qa@example.invalid']);assert.match(sent[0][2].subject,/owner/);assert.match(sent[0][2].html,/Customer email/);
});
