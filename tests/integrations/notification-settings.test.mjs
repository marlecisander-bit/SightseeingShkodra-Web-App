import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createClient} from '@supabase/supabase-js';
registerHooks({resolve(s,c,next){if(s==='@/modules/identity/operator-service'&&c.parentURL?.endsWith('/notifications/server.ts'))return {url:'data:text/javascript,export const withOperatorService=(...args)=>globalThis.notificationAuthorization(...args)',shortCircuit:true};return next(s,c);},load(url,c,next){if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};return next(url,c);}});
const {readNotificationSettings,readInbox,changeNotification}=await import('../../src/modules/notifications/server.ts');
const op='10000000-0000-4000-8000-000000000001',user='10000000-0000-4000-8000-000000000002';
function fixture(){const calls=[];const client=createClient('https://fixture.invalid','synthetic-not-a-secret',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
 const url=new URL(String(input));calls.push({url,init});let data=[];
 if(url.pathname.endsWith('admin_push_worker_status'))data=null;
 if(url.pathname.endsWith('admin_push_subscriptions'))data=[{id:user,device_name:'iPhone',enabled:true}];
 // A delivery-details read would fail, but counting processing health remains available.
 const history=url.pathname.endsWith('admin_push_deliveries')&&url.searchParams.get('select')!=='id';
 return new Response(JSON.stringify(history?{message:'history unavailable'}:data),{status:history?500:200,headers:{'content-type':'application/json','content-range':'*/0'}});
 }}});globalThis.notificationAuthorization=async(o,p,fn)=>{assert.equal(o,op);assert.equal(p,'bookings.read');return fn(client,{operatorId:op,userId:user,role:'owner'});};return calls;}
test('device setup does not depend on delivery history and missing heartbeat stays truthful',async()=>{const calls=fixture();const s=await readNotificationSettings(op);assert.equal(s.devices[0].device_name,'iPhone');assert.equal(s.history,undefined);assert(!calls.some(c=>c.url.searchParams.get('select')?.includes('notification:admin_notifications(title,message)')));assert.notEqual(s.automaticDelivery.state,'Active');});
test('inbox and unread total share a seven-day window',async()=>{const calls=fixture();await readInbox(op);const reads=calls.filter(c=>c.url.pathname.endsWith('admin_notification_receipts'));assert.equal(reads.length,2);for(const c of reads){assert.equal(c.url.searchParams.get('operator_id'),'eq.'+op);assert.equal(c.url.searchParams.get('user_id'),'eq.'+user);assert.match(c.url.searchParams.get('created_at'),/^gte\./);}});
test('clear hides only this user/operator receipts through the chosen boundary, without deleting delivery identities',async()=>{const calls=fixture(),before=new Date().toISOString();await changeNotification(op,{kind:'dismiss',before});assert.equal(calls.length,1);const c=calls[0];assert.equal(c.init.method,'PATCH');assert.equal(c.url.searchParams.get('operator_id'),'eq.'+op);assert.equal(c.url.searchParams.get('user_id'),'eq.'+user);assert.equal(c.url.searchParams.get('created_at'),'lte.'+before);assert.deepEqual(JSON.parse(c.init.body).visible,false);await assert.rejects(changeNotification(op,{kind:'dismiss',before:'bad'}));await assert.rejects(changeNotification(op,{kind:'dismiss',before:new Date(Date.now()+60000).toISOString()}));});
