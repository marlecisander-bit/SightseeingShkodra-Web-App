import assert from 'node:assert/strict';
import {test} from 'node:test';
import {backgroundDeliveryPaused} from '../../src/modules/integrations/background-delivery.ts';
import {previewConfigurationErrors} from '../../scripts/check-deployment-env.mjs';
import {runBookingEmailWorker} from '../../src/modules/integrations/booking-email-server.ts';
import {runAdminNotifications} from '../../src/modules/notifications/worker.ts';
import {sendAdminTestEmail} from '../../src/modules/integrations/email-admin-test.ts';

test('Vercel Hobby and Preview pause workers even when feature flags are enabled',()=>{
 for(const VERCEL_ENV of ['production','preview','development']) assert.equal(backgroundDeliveryPaused({VERCEL_ENV,EMAIL_ENABLED:'true',ADMIN_NOTIFICATIONS_ENABLED:'true',ADMIN_PUSH_ENABLED:'true'}),true);
 assert.equal(backgroundDeliveryPaused({}),false);
});
test('Preview refuses production bindings, incomplete isolation and communications',()=>{
 const base={VERCEL_ENV:'preview',NEXT_PUBLIC_SUPABASE_URL:'https://sandbox.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SECRET_KEY:'private-test',PREVIEW_SUPABASE_PROJECT_REF:'sandbox',PRODUCTION_SUPABASE_PROJECT_REF:'live'};
 assert.deepEqual(previewConfigurationErrors(base),[]);
 for(const change of [{PREVIEW_SUPABASE_PROJECT_REF:'live'},{NEXT_PUBLIC_SUPABASE_URL:'https://live.supabase.co'},{PRODUCTION_SUPABASE_PROJECT_REF:''},{SUPABASE_SECRET_KEY:''},{EMAIL_ENABLED:'true'},{ADMIN_PUSH_ENABLED:'true'},{ADMIN_NOTIFICATIONS_ENABLED:'true'},{SITE_INDEXING_ENABLED:'true'}]) assert(previewConfigurationErrors({...base,...change}).length);
 assert.deepEqual(previewConfigurationErrors({VERCEL_ENV:'preview'}),[]);
});
test('paused workers never touch network and Preview diagnostics never send',async()=>{
 const previous=process.env.VERCEL_ENV, transport=globalThis.fetch;
 let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('unexpected_network');};
 try {
  for(const env of ['production','preview']){
   process.env.VERCEL_ENV=env;
   assert.equal((await runBookingEmailWorker()).status,'disabled');
   assert.equal((await runAdminNotifications()).status,'disabled');
  }
  await assert.rejects(sendAdminTestEmail('test','test@example.test',{authorize:async()=>{},send:async()=>{calls++;},env:{VERCEL_ENV:'preview'},now:Date.now}),/test_unavailable/);
  assert.equal(calls,0);
 } finally {globalThis.fetch=transport;if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
});

test('explicit activation unlocks Production only and Preview build rejects activation',()=>{
 const env={VERCEL_ENV:'production',APP_ENV:'production',BACKGROUND_DELIVERY_ENABLED:'true'};
 assert.equal(backgroundDeliveryPaused(env),false);
 for(const VERCEL_ENV of ['preview','development'])assert.equal(backgroundDeliveryPaused({...env,VERCEL_ENV}),true);
 assert.equal(backgroundDeliveryPaused({...env,APP_ENV:'development'}),true);
 assert(previewConfigurationErrors({...env,VERCEL_ENV:'preview'}).length);
});
