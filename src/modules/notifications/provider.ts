import 'server-only';
import webpush from 'web-push';
import { validPushSubscription } from './contracts';
import { notificationStatus } from './config';
export async function sendWebPush(subscription: {endpoint:string;keys:{p256dh:string;auth:string}}, payload:string) {
 if (!notificationStatus().pushEnabled || !validPushSubscription(subscription)) throw Error('push_configuration');
 return webpush.sendNotification(subscription,payload,{vapidDetails:{subject:process.env.VAPID_SUBJECT!,publicKey:process.env.VAPID_PUBLIC_KEY!,privateKey:process.env.VAPID_PRIVATE_KEY!},TTL:3600,timeout:3000,urgency:'normal'});
}
