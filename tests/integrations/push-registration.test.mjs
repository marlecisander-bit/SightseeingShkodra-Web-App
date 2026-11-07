import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applicationServerKey,enableDevicePush,pushSupport,readyAdminWorker,subscriptionMatchesKey} from '../../src/modules/notifications/push-registration.ts';
import {lockScreenMessage} from '../../src/modules/notifications/lock-screen-message.ts';
const key=Buffer.from(Uint8Array.from({length:65},(_,i)=>i===0?4:i)).toString('base64url');
const device='10000000-0000-4000-8000-000000000001';
function fixture({permission='default',subscription=null,verified=true}={}){
 const calls=[];let sub=subscription;
 const created={endpoint:'https://web.push.apple.com/synthetic',options:{applicationServerKey:applicationServerKey(key).buffer},expirationTime:null,toJSON:()=>({endpoint:'https://web.push.apple.com/synthetic',keys:{p256dh:'B'.repeat(87),auth:'A'.repeat(22)}}),unsubscribe:async()=>{calls.push('unsubscribe');return true;}};
 const registration={pushManager:{getSubscription:async()=>sub,subscribe:async options=>{calls.push('subscribe');assert.deepEqual([...new Uint8Array(options.applicationServerKey)],[...applicationServerKey(key)]);sub=created;return created;}}};
 const browser={environment:()=>({secure:true,ios:true,standalone:true,apis:true}),permission:()=>permission,ask:()=>{calls.push('permission');permission='granted';return Promise.resolve('granted');},worker:async()=>{calls.push('worker');return registration;}};
 const request=async(q,a)=>{calls.push(a.kind);return a.kind==='device-status'?(verified?{id:device,enabled:true}:null):{ok:true};};
 return {browser,input:{key,name:'Synthetic iPhone',request},calls,registration,created};
}
test('iPhone Home Screen and secure-context requirements are explained before permission requests',async()=>{
 assert.equal(pushSupport({secure:true,ios:true,standalone:false,apis:false}),'INSTALL_REQUIRED');assert.equal(pushSupport({secure:false,ios:false,standalone:false,apis:true}),'UNSUPPORTED');
 const f=fixture();f.browser.environment=()=>({secure:true,ios:true,standalone:false,apis:true});await assert.rejects(enableDevicePush(f.input,f.browser),e=>e.code==='INSTALL_REQUIRED');assert.deepEqual(f.calls,[]);
});
test('explicit enable requests permission before async worker setup and verifies persistence',async()=>{
 const f=fixture();const result=await enableDevicePush(f.input,f.browser);assert.equal(result.id,device);assert.deepEqual(f.calls,['permission','worker','subscribe','subscribe','device-status']);
});
test('denial, dismissed prompt, unsupported browsers and missing server keys never register',async()=>{
 const f=fixture({permission:'denied'});await assert.rejects(enableDevicePush(f.input,f.browser),e=>e.code==='PERMISSION_DENIED');assert.deepEqual(f.calls,[]);
 f.browser.permission=()=> 'default';f.browser.ask=()=>Promise.resolve('default');await assert.rejects(enableDevicePush(f.input,f.browser),e=>e.code==='PERMISSION_DISMISSED');assert.deepEqual(f.calls,[]);
 f.browser.environment=()=>({secure:true,ios:false,standalone:false,apis:false});await assert.rejects(enableDevicePush(f.input,f.browser),e=>e.code==='UNSUPPORTED');
 assert.throws(()=>applicationServerKey('bad'),e=>e.code==='PUSH_DISABLED');
});
test('rotated keys and expired or explicitly replaced device subscriptions are renewed',async()=>{
 for(const mode of ['rotated','expired','repair']){
  const f=fixture({permission:'granted'}),old={...f.created,options:{applicationServerKey:mode==='rotated'?new Uint8Array(65).buffer:applicationServerKey(key).buffer},expirationTime:mode==='expired'?1:null};
  f.registration.pushManager.getSubscription=async()=>old;
  assert.equal(subscriptionMatchesKey(old,key),mode!=='rotated');
  await enableDevicePush({...f.input,replace:mode==='repair'},f.browser);assert.equal(f.calls[0],'worker');assert(f.calls.indexOf('device')<f.calls.indexOf('unsubscribe'));assert(f.calls.includes('unsubscribe'));assert(f.calls.includes('device-status'));
 }
});
test('failed persistence and provider subscription errors cannot produce a registered success',async()=>{
 const f=fixture({verified:false});await assert.rejects(enableDevicePush(f.input,f.browser),e=>e.code==='REGISTRATION_UNSAVED');
 f.input.request=async()=>{throw Error('request_failed');};await assert.rejects(enableDevicePush(f.input,f.browser),/request_failed/);
 const g=fixture();g.registration.pushManager.subscribe=async()=>{throw Error('contains endpoint or credentials');};await assert.rejects(enableDevicePush(g.input,g.browser),e=>e.code==='SUBSCRIBE_FAILED'&&!e.message.includes('credentials'));
});
test('service worker activation race is handled and unrelated worker is not removed',async()=>{
 const worker={state:'activated',addEventListener(){},removeEventListener(){}};
 const registration={active:null,installing:worker};
 assert.equal(await readyAdminWorker({getRegistration:async()=>null,register:async()=>registration},'https://example.test'),registration);
 let called=false;await assert.rejects(readyAdminWorker({getRegistration:async()=>({scope:'https://example.test/admin/',active:{scriptURL:'https://example.test/other.js'}}),register:async()=>{called=true;}},'https://example.test'),e=>e.code==='WORKER_FAILED');assert.equal(called,false);
 const rootWorker={scope:'https://example.test/',active:{scriptURL:'https://example.test/sw.js'}};
 assert.equal(await readyAdminWorker({getRegistration:async()=>rootWorker,register:async()=>registration},'https://example.test'),registration);
});
test('lock screen includes only booking reference and count/date grammar, never contacts, notes or totals',()=>{
 const safe='Booking SS-1234 - 2 guests / 2 seats - 2030-06-10 09:00 - EUR 20.00. Details at processing time.';
 assert.equal(lockScreenMessage(safe),'Booking SS-1234 · 2 guests / 2 seats - 2030-06-10 09:00');
 assert(!lockScreenMessage(safe.replace('2 guests','Ada private@example.invalid +355123')).includes('private'));
 assert.equal(lockScreenMessage('private@example.invalid token=secret'),'Open Admin for booking details.');
});

test('server-disabled expired subscriptions are replaced instead of re-enabling a dead endpoint',async()=>{
 const f=fixture({permission:'granted'});f.registration.pushManager.getSubscription=async()=>f.created;
 let saved=false;f.input.request=async(q,a)=>{f.calls.push(a.kind);if(a.kind==='subscribe')saved=true;return a.kind==='device-status'?{id:device,enabled:saved}:{ok:true};};
 await enableDevicePush(f.input,f.browser);assert(f.calls.includes('unsubscribe'));assert(f.calls.includes('device'));assert(saved);
});

test('valid persisted subscriptions survive repeated enable calls without subscribe, storage rewrites or duplicates',async()=>{
 const f=fixture({permission:'granted'});f.registration.pushManager.getSubscription=async()=>f.created;
 for(let i=0;i<3;i++)assert.equal((await enableDevicePush(f.input,f.browser)).id,device);
 assert(!f.calls.includes('subscribe'));assert(!f.calls.includes('unsubscribe'));assert(!f.calls.includes('device'));
 assert.equal(f.calls.filter(c=>c==='device-status').length,3);
});
