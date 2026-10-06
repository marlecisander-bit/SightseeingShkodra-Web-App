import 'server-only';
import { sendTestPush } from './test-push';
import { notificationStatus } from './config';
import { hasPermission } from '@/modules/identity/roles';
import { withOperatorService } from '@/modules/identity/operator-service';
import { notificationTypes, uuid, validPushSubscription, type Inbox, type InboxItem, type Preference } from './contracts';

export async function readInbox(operatorId:string,filter='all',cursor?:string):Promise<Inbox> {
 return withOperatorService(operatorId,'bookings.read',async(client,context)=>{
  const base=()=>client.from('admin_notification_receipts').select('id,notification_id,read_at,created_at,notification:admin_notifications!inner(id,type,title,message,booking_id,severity,event_at)').eq('operator_id',context.operatorId).eq('user_id',context.userId).eq('visible',true);
  let q=base();
  if(filter==='unread')q=q.is('read_at',null);
  else if(filter==='system')q=q.in('notification.type',['email_delivery_failed','payment_status_changed','booking_status_changed']);
  else if(notificationTypes.some(t=>t===filter))q=q.eq('notification.type',filter);
  if(cursor){const [time,id]=cursor.split('|');if(!uuid.test(id??'')||!/^\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?$/.test(time)||!Number.isFinite(Date.parse(time)))throw Error('Invalid page');q=q.or(`created_at.lt.${time},and(created_at.eq.${time},id.lt.${id})`);}
  const [list,count]=await Promise.all([q.order('created_at',{ascending:false}).order('id',{ascending:false}).limit(26),client.from('admin_notification_receipts').select('id',{count:'exact',head:true}).eq('operator_id',context.operatorId).eq('user_id',context.userId).eq('visible',true).is('read_at',null)]);
  if(list.error||count.error)throw Error('Notifications unavailable');
  const rows=(list.data??[]) as unknown as InboxItem[];const items=rows.slice(0,25);const last=items.at(-1);
  return {items,unread:count.count??0,next:rows.length>25&&last?`${last.created_at}|${last.id}`:null};
 });
}
export async function readNotificationSettings(operatorId:string) {
 return withOperatorService(operatorId,'bookings.read',async(client,c)=>{
  const [devices,prefs]=await Promise.all([client.from('admin_push_subscriptions').select('id,device_name,enabled,created_at,last_used_at').eq('operator_id',c.operatorId).eq('user_id',c.userId).order('created_at',{ascending:false}).limit(50),client.from('admin_notification_preferences').select('type,in_app,push').eq('operator_id',c.operatorId).eq('user_id',c.userId)]);
  if(devices.error||prefs.error)throw Error('Settings unavailable');
  const ids=(devices.data??[]).map(d=>d.id);
  const history=ids.length?await client.from('admin_push_deliveries').select('id,status,attempts,error_code,created_at,notification:admin_notifications(title,message)').eq('operator_id',c.operatorId).in('subscription_id',ids).order('created_at',{ascending:false}).limit(25):{data:[],error:null};
  if(history.error)throw Error('Delivery history unavailable');
  return {history:history.data??[],canManageEmail:hasPermission(c.role,'integrations.manage'),devices:devices.data,preferences:notificationTypes.map(type=>(prefs.data as Preference[]).find(p=>p.type===type)??{type,in_app:true,push:true}),publicKey:notificationStatus().pushEnabled?process.env.VAPID_PUBLIC_KEY??'':'',...notificationStatus()};
 });
}
export async function changeNotification(operatorId:string,action:unknown) {
 if(!action||typeof action!=='object')throw Error('Invalid request');
 const a=action as Record<string,unknown>;
 if(a.kind==='test-push'){if(typeof a.id!=='string')throw Error('Invalid device');return sendTestPush(operatorId,a.id);}
 return withOperatorService(operatorId,'bookings.read',async(client,c)=>{
  if(a.kind==='read'){
   if(typeof a.read!=='boolean'||(a.id!=='all'&&(typeof a.id!=='string'||!uuid.test(a.id))))throw Error('Invalid receipt');
   let q=client.from('admin_notification_receipts').update({read_at:a.read?new Date().toISOString():null}).eq('operator_id',c.operatorId).eq('user_id',c.userId);
   if(a.id==='all'){if(!a.read)throw Error('Invalid operation');q=q.eq('visible',true).is('read_at',null);}else q=q.eq('id',a.id);
   if((await q).error)throw Error('Unable to update notifications');
  }else if(a.kind==='preference'){
   if(!notificationTypes.some(t=>t===a.type)||typeof a.in_app!=='boolean'||typeof a.push!=='boolean')throw Error('Invalid preference');
   if((await client.from('admin_notification_preferences').upsert({operator_id:c.operatorId,user_id:c.userId,type:a.type,in_app:a.in_app,push:a.push})).error)throw Error('Unable to save preference');
  }else if(a.kind==='subscribe'){
   if(process.env.ADMIN_PUSH_ENABLED!=='true'||!validPushSubscription(a.subscription)||typeof a.name!=='string'||!a.name.trim()||a.name.length>60)throw Error('Push subscription unavailable or unsupported');
   const s=a.subscription;
   const existing=await client.from('admin_push_subscriptions').select('id,user_id,operator_id').eq('endpoint',s.endpoint).maybeSingle();
   if(existing.error||existing.data&&(existing.data.user_id!==c.userId||existing.data.operator_id!==c.operatorId))throw Error('This browser is registered to another workspace or account. Disable its previous subscription first.');
   const {count,error}=await client.from('admin_push_subscriptions').select('id',{count:'exact',head:true}).eq('operator_id',c.operatorId).eq('user_id',c.userId);
   if(error||(!existing.data&&(count??0)>=50))throw Error('Device limit reached');
   const row={operator_id:c.operatorId,user_id:c.userId,endpoint:s.endpoint,p256dh:s.keys.p256dh,auth:s.keys.auth,device_name:a.name.trim(),enabled:true,updated_at:new Date().toISOString()};
   const result=existing.data?await client.from('admin_push_subscriptions').update(row).eq('id',existing.data.id).eq('user_id',c.userId):await client.from('admin_push_subscriptions').insert(row);
   if(result.error)throw Error('Unable to register device');
  }else if(a.kind==='device'){
   if(typeof a.id!=='string'||!uuid.test(a.id))throw Error('Invalid device');
   const q=a.remove===true?client.from('admin_push_subscriptions').delete():client.from('admin_push_subscriptions').update({enabled:false,updated_at:new Date().toISOString()});
   if((await q.eq('id',a.id).eq('operator_id',c.operatorId).eq('user_id',c.userId)).error)throw Error('Unable to revoke device');
  }else if(a.kind==='device-status'){
   if(typeof a.endpoint!=='string'||a.endpoint.length>2048)throw Error('Invalid device');
   const {data,error}=await client.from('admin_push_subscriptions').select('id,enabled').eq('endpoint',a.endpoint).eq('operator_id',c.operatorId).eq('user_id',c.userId).maybeSingle();
   if(error)throw Error('Device unavailable');return data;
  }else throw Error('Invalid operation');
  return {ok:true};
 });
}
