import 'server-only';
import { withOperatorService } from '../identity/operator-service';
import { notificationStatus } from './config';
import { sendWebPush } from './provider';
import { pushFailure } from './push';
import { uuid } from './contracts';
/** Explicit diagnostic for the authenticated user's own device; no booking queue drain. */
export async function sendTestPush(operator:string,id:string,run=withOperatorService,send=sendWebPush,status=notificationStatus) {
 return run(operator,'bookings.read',async(client,c)=>{
  if(!uuid.test(id)||!status().pushEnabled)throw Error('Push is not enabled');
  const {data:sub,error}=await client.from('admin_push_subscriptions').select('endpoint,p256dh,auth').eq('id',id).eq('operator_id',c.operatorId).eq('user_id',c.userId).eq('enabled',true).maybeSingle();
  if(error||!sub)throw Error('Device unavailable');
  const requestKey='push-test:'+c.staffProfileId+':'+Math.floor(Date.now()/60000);
  const audit={operator_id:c.operatorId,actor_id:c.staffProfileId,entity_type:'push_subscription',entity_id:id};
  const recent=await client.from('audit_logs').select('id').eq('operator_id',c.operatorId).eq('actor_id',c.staffProfileId).eq('action','push.test_started').gte('created_at',new Date(Date.now()-60000).toISOString()).limit(1);
  if(recent.error||recent.data?.length)throw Error('Wait a minute before testing again');
  if((await client.from('audit_logs').insert({...audit,action:'push.test_started',idempotency_key:requestKey,metadata:{channel:'push'}})).error)throw Error('Unable to record test');
  let outcome='accepted',code='accepted';
  try{await send({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({title:'Test notification',body:'Sightseeing Shkodra notifications are connected on this device.',tag:'sightseeing-device-test',url:'/admin'}));}
  catch(error){const failure=pushFailure(error);outcome=failure.result;code=failure.code;}
  if(outcome==='expired')await client.from('admin_push_subscriptions').update({enabled:false,updated_at:new Date().toISOString()}).eq('id',id).eq('operator_id',c.operatorId).eq('user_id',c.userId);
  const recorded=await client.from('audit_logs').insert({...audit,action:'push.test_finished',idempotency_key:requestKey+':finish',metadata:{channel:'push',status:outcome,code}});
  if(recorded.error)return {status:'uncertain',code:'audit_unavailable'};
  return {status:outcome,code};
 });
}
