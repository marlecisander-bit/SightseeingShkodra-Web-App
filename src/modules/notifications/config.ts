import 'server-only';
import {createECDH,timingSafeEqual} from 'node:crypto';
import { backgroundDeliveryPaused } from '../integrations/background-delivery';
export function matchingVapidKeys(publicKey:string,privateKey:string){
 try{
  const expected=Buffer.from(publicKey,'base64url'),secret=Buffer.from(privateKey,'base64url');
  if(expected.length!==65||expected[0]!==4||secret.length!==32)return false;
  const curve=createECDH('prime256v1');curve.setPrivateKey(secret);
  const derived=curve.getPublicKey();return derived.length===expected.length&&timingSafeEqual(derived,expected);
 }catch{return false;}
}
export function notificationStatus(env: NodeJS.ProcessEnv = process.env) {
 const configured = /^[A-Za-z0-9_-]{87}=?$/.test(env.VAPID_PUBLIC_KEY ?? '')
  && /^[A-Za-z0-9_-]{43}=?$/.test(env.VAPID_PRIVATE_KEY ?? '')
  && matchingVapidKeys(env.VAPID_PUBLIC_KEY??'',env.VAPID_PRIVATE_KEY??'')
  && /^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|https:\/\/[^\s]+)$/.test(env.VAPID_SUBJECT ?? '');
 const paused = backgroundDeliveryPaused(env);
 const workerEnabled = !paused && env.ADMIN_NOTIFICATIONS_ENABLED === 'true';
 const pushEnabled = workerEnabled && env.ADMIN_PUSH_ENABLED === 'true' && configured;
 const registrationEnabled = configured && env.ADMIN_PUSH_ENABLED === 'true' && (!env.VERCEL_ENV || env.VERCEL_ENV === 'production');
 return {configured, workerEnabled, pushEnabled, registrationEnabled, paused};
}
