import {test} from 'node:test';
import assert from 'node:assert/strict';
import webpush from 'web-push';
import {matchingVapidKeys,notificationStatus} from '../../src/modules/notifications/config.ts';
import {sendTestPush} from '../../src/modules/notifications/test-push.ts';
const pair=webpush.generateVAPIDKeys();
const configured={VERCEL_ENV:'production',APP_ENV:'production',BACKGROUND_DELIVERY_ENABLED:'true',ADMIN_NOTIFICATIONS_ENABLED:'true',ADMIN_PUSH_ENABLED:'true',VAPID_PUBLIC_KEY:pair.publicKey,VAPID_PRIVATE_KEY:pair.privateKey,VAPID_SUBJECT:'mailto:owner@example.invalid'};
test('safe push status requires activation, projector and complete configuration without exposing keys',()=>{
 assert.equal(notificationStatus(configured).pushEnabled,true);
 for(const key of ['BACKGROUND_DELIVERY_ENABLED','ADMIN_NOTIFICATIONS_ENABLED','ADMIN_PUSH_ENABLED','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'])assert.equal(notificationStatus({...configured,[key]:''}).pushEnabled,false);
 assert.equal(notificationStatus({...configured,VERCEL_ENV:'preview'}).pushEnabled,false);
 assert(!JSON.stringify(notificationStatus(configured)).includes(configured.VAPID_PRIVATE_KEY));
});
test('test push authorization failure never calls provider',async()=>{let sent=0;await assert.rejects(sendTestPush('op','id',async()=>{throw Error('denied');},async()=>sent++),/denied/);assert.equal(sent,0);});
test('test push refuses disabled delivery before database work',async()=>{let read=0;await assert.rejects(sendTestPush('op','10000000-0000-4000-8000-000000000001',async(op,p,fn)=>fn({from:()=>{read++;}},{operatorId:op}),async()=>{},()=>({pushEnabled:false})),e=>e.code==='DELIVERY_PAUSED');assert.equal(read,0);});

test('mismatched VAPID key pairs are configuration errors; safe registration can precede delivery activation',()=>{
 const other=webpush.generateVAPIDKeys();assert.equal(matchingVapidKeys(pair.publicKey,other.privateKey),false);
 assert.equal(notificationStatus({...configured,VAPID_PRIVATE_KEY:other.privateKey}).configured,false);
 const paused=notificationStatus({...configured,BACKGROUND_DELIVERY_ENABLED:'false'});assert.equal(paused.registrationEnabled,true);assert.equal(paused.pushEnabled,false);
 assert.equal(notificationStatus({...configured,VERCEL_ENV:'preview'}).registrationEnabled,false);
});

test('public manifest and worker bootstrap do not depend on auth refresh',async()=>{
 const {NextRequest}=await import('next/server');const {proxy}=await import('../../src/proxy.ts');
 for(const path of ['/admin/sw.js','/admin/manifest.webmanifest']){
  const result=await proxy(new NextRequest('https://sightseeingshkodra.app'+path));assert.equal(result.status,200);
 }
 const {readFile}=await import('node:fs/promises');const manifest=JSON.parse(await readFile(new URL('../../public/admin/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.id,'/admin');assert.equal(manifest.display,'standalone');assert(manifest.start_url.startsWith(manifest.scope));assert(manifest.icons.some(i=>i.sizes==='192x192'));assert(manifest.icons.some(i=>i.sizes==='512x512'));
});
