import {test} from 'node:test';
import assert from 'node:assert/strict';
import {notificationStatus} from '../../src/modules/notifications/config.ts';
import {sendTestPush} from '../../src/modules/notifications/test-push.ts';
const configured={VERCEL_ENV:'production',APP_ENV:'production',BACKGROUND_DELIVERY_ENABLED:'true',ADMIN_NOTIFICATIONS_ENABLED:'true',ADMIN_PUSH_ENABLED:'true',VAPID_PUBLIC_KEY:'B'.repeat(87),VAPID_PRIVATE_KEY:'A'.repeat(43),VAPID_SUBJECT:'mailto:owner@example.invalid'};
test('safe push status requires activation, projector and complete configuration without exposing keys',()=>{
 assert.equal(notificationStatus(configured).pushEnabled,true);
 for(const key of ['BACKGROUND_DELIVERY_ENABLED','ADMIN_NOTIFICATIONS_ENABLED','ADMIN_PUSH_ENABLED','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'])assert.equal(notificationStatus({...configured,[key]:''}).pushEnabled,false);
 assert.equal(notificationStatus({...configured,VERCEL_ENV:'preview'}).pushEnabled,false);
 assert(!JSON.stringify(notificationStatus(configured)).includes(configured.VAPID_PRIVATE_KEY));
});
test('test push authorization failure never calls provider',async()=>{let sent=0;await assert.rejects(sendTestPush('op','id',async()=>{throw Error('denied');},async()=>sent++),/denied/);assert.equal(sent,0);});
test('test push refuses disabled delivery before database work',async()=>{let read=0;await assert.rejects(sendTestPush('op','10000000-0000-4000-8000-000000000001',async(op,p,fn)=>fn({from:()=>{read++;}},{operatorId:op}),async()=>{},()=>({pushEnabled:false})),/not enabled/);assert.equal(read,0);});
