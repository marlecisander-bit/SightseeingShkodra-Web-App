import { backgroundDeliveryPaused } from '../integrations/background-delivery';
export function notificationStatus(env: NodeJS.ProcessEnv = process.env) {
 const configured = /^[A-Za-z0-9_-]{87}=?$/.test(env.VAPID_PUBLIC_KEY ?? '')
  && /^[A-Za-z0-9_-]{43}=?$/.test(env.VAPID_PRIVATE_KEY ?? '')
  && /^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|https:\/\/[^\s]+)$/.test(env.VAPID_SUBJECT ?? '');
 const paused = backgroundDeliveryPaused(env);
 const workerEnabled = !paused && env.ADMIN_NOTIFICATIONS_ENABLED === 'true';
 const pushEnabled = workerEnabled && env.ADMIN_PUSH_ENABLED === 'true' && configured;
 return {configured, workerEnabled, pushEnabled, paused};
}
