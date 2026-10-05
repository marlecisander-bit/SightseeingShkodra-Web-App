export const notificationTypes = ['booking_created','booking_modified','booking_cancelled','booking_status_changed','payment_status_changed','email_delivery_failed'] as const;
export type NotificationType = typeof notificationTypes[number];
export const notificationLabels: Record<NotificationType,string> = {booking_created:'New bookings',booking_modified:'Modifications',booking_cancelled:'Cancellations',booking_status_changed:'Check-in',payment_status_changed:'Payments',email_delivery_failed:'Email failures'};
export type InboxItem = {id:string; notification_id:string; read_at:string|null; created_at:string; notification:{id:string;type:NotificationType;title:string;message:string;booking_id:string;severity:string;event_at:string}};
export type Device = {id:string;device_name:string;enabled:boolean;created_at:string;last_used_at:string|null};
export type Preference = {type:NotificationType;in_app:boolean;push:boolean};
export type Inbox = {items:InboxItem[];unread:number;next:string|null};
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function bookingTarget(operator:string,booking:string) {
 if(!uuid.test(operator)||!uuid.test(booking)) throw Error('Invalid booking destination');
 return `/admin/${operator}/bookings?booking=${booking}`;
}
export function safeAdminReturn(value:unknown):string {
 if(typeof value!=='string')return '/admin';
 const match=/^\/admin\/([^/]+)\/(overview|bookings|departures|content|reviews|catalog|notifications|email)(?:\?([^#]*))?$/.exec(value);
 if(!match||!uuid.test(match[1]))return '/admin';
 if(!match[3])return value;
 const query=new URLSearchParams(match[3]);
 const seen=new Set<string>();
 for(const [key,item] of query){
  if(seen.has(key))return '/admin';
  seen.add(key);
  if(key==='booking'&&match[2]==='bookings'&&uuid.test(item))continue;
  if(key==='date'&&['bookings','departures'].includes(match[2])&&/^\d{4}-\d{2}-\d{2}$/.test(item)&&!Number.isNaN(Date.parse(item))&&new Date(item).toISOString().slice(0,10)===item)continue;
  return '/admin';
 }
 return value;
}
/** Explicit browser push services only. No arbitrary URLs, IPs or redirect targets. */
export function validPushSubscription(value:unknown): value is {endpoint:string;keys:{p256dh:string;auth:string}} {
 if(!value||typeof value!=='object')return false;
 const v=value as {endpoint?:unknown;keys?:{p256dh?:unknown;auth?:unknown}};
 if(typeof v.endpoint!=='string'||v.endpoint.length>2048||typeof v.keys?.p256dh!=='string'||typeof v.keys.auth!=='string')return false;
 try {const u=new URL(v.endpoint);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return false;
 const h=u.hostname;
 if(!(h==='fcm.googleapis.com'||h==='updates.push.services.mozilla.com'||h==='web.push.apple.com'||/^[a-z0-9-]+\.push\.apple\.com$/.test(h)||h==='wns.windows.com'||/^[a-z0-9-]+\.notify\.windows\.com$/.test(h)))return false;
 return /^[A-Za-z0-9_-]{87}=?$/.test(v.keys.p256dh)&&/^[A-Za-z0-9_-]{22}={0,2}$/.test(v.keys.auth);
 }catch{return false;}
}
