import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {randomUUID} from 'node:crypto';
import {Webhook} from 'svix';
import {receiveResendWebhook,verifyResendEvent} from '../../src/modules/integrations/resend-webhook.ts';
import {canRetryEmail,emailOutcomeLabel} from '../../src/modules/integrations/email-delivery-status.ts';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
const secret='whsec_'+Buffer.alloc(32,7).toString('base64');
function signed(payload,{id='msg_fixture',date=new Date(),body=JSON.stringify(payload)}={}){
 const headers=new Headers({'svix-id':id,'svix-timestamp':String(Math.floor(date.getTime()/1000)),'svix-signature':new Webhook(secret).sign(id,date,body)});
 return {headers,body};
}
const event=(kind='delivered',message=randomUUID())=>({type:'email.'+kind,created_at:new Date().toISOString(),data:{email_id:message,to:['private@example.invalid'],subject:'private sentinel',bounce:{type:'Permanent'}}});
test('raw signatures, timestamp replay protection, multiple signatures and data minimization',()=>{
 const payload=event(),s=signed(payload);const result=verifyResendEvent(s.body,s.headers,secret);
 assert.equal(result.kind,'delivered');assert.ok(!JSON.stringify(result).includes('private'));
 assert.throws(()=>verifyResendEvent(s.body+' ',s.headers,secret));
 assert.throws(()=>verifyResendEvent(s.body,new Headers(),secret));
 const old=signed(payload,{date:new Date(Date.now()-600000)});assert.throws(()=>verifyResendEvent(old.body,old.headers,secret));
 const future=signed(payload,{date:new Date(Date.now()+600000)});assert.throws(()=>verifyResendEvent(future.body,future.headers,secret));
 s.headers.set('svix-signature','v1,invalid '+s.headers.get('svix-signature'));assert.equal(verifyResendEvent(s.body,s.headers,secret).kind,'delivered');
 assert.equal(verifyResendEvent(...(()=>{const x=signed({...payload,type:'email.opened'});return [x.body,x.headers,secret]})()),null);
});
test('route rejects invalid signatures/configuration/oversize without persistence; durable failures retry',async()=>{
 let saved=0;const logs=[];const payload=event(),s=signed(payload);
 const dep={secret,save:async()=>{saved++;},log:x=>logs.push(x)};
 const request=(body=s.body,headers=s.headers)=>new Request('https://example.invalid/api/webhooks/resend',{method:'POST',body,headers});
 assert.equal((await receiveResendWebhook(request(),{...dep,secret:undefined})).status,503);
 assert.equal((await receiveResendWebhook(request(s.body+' '),dep)).status,401);
 assert.equal(saved,0);assert.equal((await receiveResendWebhook(request('x'.repeat(262145)),dep)).status,413);
 assert.equal((await receiveResendWebhook(request(),dep)).status,200);assert.equal(saved,1);
 assert.equal((await receiveResendWebhook(request(),{...dep,save:async()=>{throw Error('private sentinel');}})).status,503);
 assert.ok(!JSON.stringify(logs).includes('private'));assert.ok(logs.includes('verification_failed'));
});
let db;const op='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
before(async()=>{db=await createTestDatabase();await loadDevelopmentFixtures(db);await db.query("insert into operators(id,name) values($1,'Other synthetic operator') on conflict do nothing",[other]);});
after(async()=>db?.close());
async function job(operator=op){
 const customer=(await db.query("insert into customers(operator_id,name,email) values($1,'Synthetic','test@example.invalid') returning id",[operator])).rows[0].id;
 const order=(await db.query("insert into orders(operator_id,customer_id,currency,subtotal,total) values($1,$2,'EUR',1000,1000) returning id",[operator,customer])).rows[0].id;
 const booking=(await db.query("insert into bookings(operator_id,order_id,booking_reference,status) values($1,$2,$3,'pending') returning id",[operator,order,'SS-'+randomUUID()])).rows[0].id;
 const domain=(await db.query("insert into domain_events(operator_id,aggregate_type,aggregate_id,event_type,payload) values($1,'booking',$2,'booking.confirmed',$3) returning id",[operator,booking,JSON.stringify({bookingId:booking})])).rows[0].id;
 return (await db.query("insert into notification_deliveries(operator_id,event_id,booking_id,recipient_type,event_type,channel,status) values($1,$2,$3,'customer','BOOKING_CREATED','email','accepted') returning *",[operator,domain,booking])).rows[0];
}
async function record(message,kind,id=randomUUID(),at=new Date().toISOString(),reason=null){return db.query('select record_email_provider_event_v1($1,$2,$3,$4,$5,$6) result',[op,id,message,kind,at,reason]);}
async function row(id){return (await db.query('select * from notification_deliveries where id=$1',[id])).rows[0];}
test('provider events arriving before acceptance are linked on finish; duplicate IDs do not grow history',async()=>{
 const d=await job(),message=randomUUID(),id=randomUUID(),at=new Date().toISOString();
 assert.equal((await record(message,'delivered',id,at)).rows[0].result,'unmatched');
 await db.query("update notification_deliveries set provider='resend',provider_reference=$2 where id=$1",[d.id,message]);
 assert.equal((await row(d.id)).provider_status,'delivered');
 assert.equal((await record(message,'delivered',id,at)).rows[0].result,'duplicate');
 assert.equal((await db.query('select count(*)::int n from email_provider_events where delivery_id=$1',[d.id])).rows[0].n,1);
 await assert.rejects(record(message,'sent',id,at),/Conflicting/);
 assert.equal((await row(d.id)).status,'accepted','transport state never changes');
});
test('out-of-order events preserve adverse terminal evidence and full history',async()=>{
 const d=await job(),message=randomUUID();await db.query("update notification_deliveries set provider='resend',provider_reference=$2 where id=$1",[d.id,message]);
 for(const kind of ['delivered','sent','delivery_delayed','bounced','delivered','suppressed','complained','sent'])await record(message,kind);
 assert.equal((await row(d.id)).provider_status,'complained');assert.equal((await row(d.id)).delivery_state,'complained');
 assert.equal((await db.query('select count(*)::int n from email_provider_events where delivery_id=$1',[d.id])).rows[0].n,8);
});
test('bounded worker linkage repairs a committed unmatched event without sending jobs',async()=>{
 const d=await job(),message=randomUUID();
 await db.exec('alter table notification_deliveries disable trigger link_email_provider_events');
 try{await db.query("update notification_deliveries set provider='resend',provider_reference=$2 where id=$1",[d.id,message]);}finally{await db.exec('alter table notification_deliveries enable trigger link_email_provider_events');}
 await record(message,'suppressed',undefined,undefined,'suppressed_by_provider');
 await db.query('select link_pending_email_provider_events_v1($1)',[op]);assert.equal((await row(d.id)).provider_status,'suppressed');
});
test('RPC denies browser writes, RLS isolates operators, and duplicate provider IDs cannot cross-link',async()=>{
 const a=await job(),b=await job(other),message=randomUUID();await db.query("update notification_deliveries set provider='resend',provider_reference=$2 where id=$1",[a.id,message]);await record(message,'failed',undefined,undefined,'provider_failed');
 await assert.rejects(db.query("select record_email_provider_event_v1($1,$2,$3,'delivered',clock_timestamp(),null)",[other,randomUUID(),message]),/workspace mismatch/);
 await assert.rejects(db.query("update notification_deliveries set provider='resend',provider_reference=$2 where id=$1",[b.id,message]),/duplicate/);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{await assert.rejects(record(message,'delivered'));await assert.rejects(db.query('select email_delivery_health_v1($1)',[op]));}finally{await db.exec('reset role');}}
 const user=randomUUID();await db.query('insert into auth.users values($1)',[user]);await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner')",[other,user]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.exec('set role authenticated');try{assert.equal((await db.query('select * from email_provider_events where delivery_id=$1',[a.id])).rows.length,0);}finally{await db.exec('reset role');}
});
test('acceptance, uncertain, suppression, delivery and complaints cannot be resent',async()=>{
 for(const r of [{status:'accepted'},{status:'uncertain'},{status:'accepted',provider_status:'suppressed'},{status:'accepted',provider_status:'delivered'},{status:'accepted',provider_status:'complained'}])assert.equal(canRetryEmail(r),false);
 assert.equal(canRetryEmail({status:'accepted',provider_status:'bounced'}),true);
 assert.match(emailOutcomeLabel({status:'accepted'}),/Accepted/);assert.match(emailOutcomeLabel({status:'accepted',provider_status:'delivered'}),/receiving server/);
 const d=await job();await assert.rejects(db.query('select request_booking_email_v2($1,$2,$3,$4)',[op,randomUUID(),d.booking_id,randomUUID()]),/recipient-specific/);
});

test('provider lookups are read-only, scoped, minimized and never send messages on failure',async()=>{
 const {reconcileEmailOutcome}=await import('../../src/modules/integrations/email-provider-reconciliation.ts');
 const config={enabled:true,apiKey:'secret-sentinel',statusApiKey:'status-key-sentinel',operatorId:op};const calls=[],logs=[];
 const client={rpc:async(name,args)=>{calls.push({name,args});return name==='claim_email_provider_check_v1'?{data:[{id:'fixture',provider_reference:'provider_fixture',provider_check_count:1}],error:null}:{data:'recorded',error:null};}};
 await reconcileEmailOutcome(client,config,async(url,init)=>{assert.equal(init.method,'GET');assert.equal(url,'https://api.resend.com/emails/provider_fixture');return Response.json({id:'provider_fixture',last_event:'suppressed',to:['private@example.invalid'],html:'private sentinel'});},x=>logs.push(x));
 assert.equal(calls[1].args.p_operator_id,op);assert.equal(calls[1].args.p_source,'reconciliation');assert.equal(calls[1].args.p_kind,'suppressed');assert.ok(!JSON.stringify(calls).includes('private'));
 calls.length=0;await reconcileEmailOutcome(client,config,async()=>new Response('',{status:403}),x=>logs.push(x));assert.equal(calls.length,1);assert.ok(logs.includes('read_permission_required'));assert.ok(!JSON.stringify(logs).includes('secret-sentinel'));
});
test('lookup scheduling is bounded and recovery retains rows and transport state',async()=>{
 const d=await job(),message=randomUUID();await db.query("update notification_deliveries set provider='resend',provider_reference=$2,sent_at=clock_timestamp()-interval '20 minutes' where id=$1",[d.id,message]);
 const claim=await db.query('select * from claim_email_provider_check_v1($1)',[op]);assert.equal(claim.rows.length,1);assert.equal(claim.rows[0].id,d.id);
 assert.equal((await db.query('select * from claim_email_provider_check_v1($1)',[op])).rows.length,0);
 for(let i=0;i<3;i++){await db.query("update notification_deliveries set provider_checked_at=clock_timestamp()-interval '7 hours' where id=$1",[d.id]);assert.equal((await db.query('select * from claim_email_provider_check_v1($1)',[op])).rows.length,1);}
 await db.query("update notification_deliveries set provider_checked_at=clock_timestamp()-interval '7 hours' where id=$1",[d.id]);assert.equal((await db.query('select * from claim_email_provider_check_v1($1)',[op])).rows.length,0);assert.equal((await row(d.id)).status,'accepted');
});
