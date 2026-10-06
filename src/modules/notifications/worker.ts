import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { sendWebPush } from './provider';
import { processPush, type PushJob, type PushStore, type PushData } from './push';
import { uuid } from './contracts';
import { backgroundDeliveryPaused } from '../integrations/background-delivery';
export async function runAdminNotifications(){
 if(backgroundDeliveryPaused())return {status:'disabled',projected:0,processed:0};
 if(process.env.ADMIN_NOTIFICATIONS_ENABLED!=='true')return {status:'disabled',projected:0,processed:0};
 const operator=process.env.PUBLIC_OPERATOR_ID??'',since=process.env.ADMIN_NOTIFICATIONS_START_AT??'';
 if(!uuid.test(operator)||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(since)||!Number.isFinite(Date.parse(since)))throw Error('notification_configuration');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw Error('notification_configuration');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(3000)})}});
 const call=async(name:string,args:Record<string,unknown>)=>{const r=await client.rpc(name,args);if(r.error)throw Error('notification_store_unavailable');return r.data;};
 const projected=await call('project_admin_notifications_v1',{p_operator_id:operator,p_since:since});
 if(process.env.ADMIN_PUSH_ENABLED!=='true')return {status:'in_app',projected,processed:0};
 const publicKey=process.env.VAPID_PUBLIC_KEY,privateKey=process.env.VAPID_PRIVATE_KEY,subject=process.env.VAPID_SUBJECT;
 if(!publicKey||!privateKey||!subject||! /^(mailto:|https:\/\/)/.test(subject))throw Error('push_configuration');
 const identity=(j:PushJob)=>({p_operator_id:operator,p_id:j.id,p_token:j.lease_token});
 const store:PushStore={
  async claim(){const rows=await call('claim_admin_push_v1',{p_operator_id:operator});return rows[0]??null;},
  async read(j){
   if(j.operator_id!==operator)throw Error('operator_mismatch');
   const [sub,n]=await Promise.all([client.from('admin_push_subscriptions').select('endpoint,p256dh,auth,user_id').eq('operator_id',operator).eq('id',j.subscription_id).eq('enabled',true).maybeSingle(),client.from('admin_notifications').select('id,title,message,booking_id,type').eq('operator_id',operator).eq('id',j.notification_id).single()]);
   if(sub.error||n.error)throw Error('notification_read');if(!sub.data)return null;
   const [member,pref]=await Promise.all([client.from('staff_profiles').select('id').eq('operator_id',operator).eq('auth_user_id',sub.data.user_id).eq('is_active',true).in('role',['owner','admin','operations']).maybeSingle(),client.from('admin_notification_preferences').select('push').eq('operator_id',operator).eq('user_id',sub.data.user_id).eq('type',n.data.type).maybeSingle()]);
   if(member.error||pref.error)throw Error('notification_access');if(!member.data||pref.data?.push===false)return null;
   return {subscription:sub.data,notification:n.data} as PushData;
  },
  async finish(j,result,code){await call('finish_admin_push_v1',{...identity(j),p_result:result,p_code:code});},
 };
 const processed=await processPush(store,sendWebPush);
 return {status:'push',projected,processed};
}
