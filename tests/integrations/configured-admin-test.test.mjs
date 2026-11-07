import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sendConfiguredAdminTest} from '../../src/modules/integrations/configured-admin-test.ts';
import {emailAdminStatus} from '../../src/modules/integrations/email-admin-status.ts';
const operator='10000000-0000-4000-8000-000000000001';
const env={NODE_ENV:'production',APP_ENV:'production',VERCEL_ENV:'production',RESEND_API_KEY:'synthetic-secret',PUBLIC_OPERATOR_ID:operator,RESEND_FROM_EMAIL:'Sightseeing Shkodra <tickets@sightseeingshkodra.com>',BOOKING_OWNER_EMAIL:'admin@example.invalid',BOOKING_REPLY_TO_EMAIL:'reply@example.invalid',EMAIL_START_AT:'2026-11-07T00:00:00Z',NEXT_PUBLIC_SITE_URL:'https://sightseeingshkodra.app',EMAIL_ENABLED:'false'};
test('configured-admin diagnostic is labelled, uses only trusted admin address, creates no booking and has stable idempotency',async()=>{
 const sent=[];const dependencies={authorize:async(op,permission)=>{assert.equal(op,operator);assert.equal(permission,'integrations.manage');},env,now:()=>1000,send:async(...args)=>{sent.push(args);return {outcome:'accepted',reference:'synthetic-provider-id'};}};
 const a=await sendConfiguredAdminTest(operator,dependencies),b=await sendConfiguredAdminTest(operator,dependencies);assert.equal(a.providerId,b.providerId);assert.equal(sent[0][1],sent[1][1]);
 const msg=sent[0][2];assert.deepEqual(msg.to,[env.BOOKING_OWNER_EMAIL]);assert.equal(msg.from,env.RESEND_FROM_EMAIL);assert.equal(msg.reply_to,env.BOOKING_REPLY_TO_EMAIL);assert(msg.subject.startsWith('[TEST]'));assert(!msg.text.includes('SS-'));assert(!msg.html.includes('booking-qr'));assert(!msg.html.includes('Manage booking'));assert.equal(msg.headers.Importance,'high');assert.equal(env.EMAIL_ENABLED,'false');
});
test('test denies unauthorized, wrong-workspace, preview and development recipient escape; failures never report acceptance',async()=>{
 let sent=0;const dependencies={authorize:async()=>{throw Error('denied');},env,now:()=>0,send:async()=>{sent++;return {outcome:'accepted',reference:'id'};}};
 await assert.rejects(sendConfiguredAdminTest(operator,dependencies),/denied/);assert.equal(sent,0);dependencies.authorize=async()=>{};
 await assert.rejects(sendConfiguredAdminTest('wrong',dependencies));await assert.rejects(sendConfiguredAdminTest(operator,{...dependencies,env:{...env,VERCEL_ENV:'preview'}}));
 await assert.rejects(sendConfiguredAdminTest(operator,{...dependencies,env:{...env,NODE_ENV:'development',APP_ENV:'development',VERCEL_ENV:undefined,EMAIL_TEST_RECIPIENT:'customer@example.invalid'}}));assert.equal(sent,0);
 for(const outcome of ['failed','retry'])await assert.rejects(sendConfiguredAdminTest(operator,{...dependencies,send:async()=>({outcome})}),/not_accepted/);
});
test('sender-domain readiness detects the production .app mismatch without overriding configured or frozen senders',()=>{
 assert.equal(emailAdminStatus(operator,env).senderDomainMatches,true);
 const old={...env,RESEND_FROM_EMAIL:'Sightseeing Shkodra <tickets@sightseeingshkodra.app>'};assert.equal(emailAdminStatus(operator,old).senderDomainMatches,false);assert.equal(emailAdminStatus(operator,old).senderEmail,'tickets@sightseeingshkodra.app');
});
