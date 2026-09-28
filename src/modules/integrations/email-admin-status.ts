import 'server-only';
import { bookingEmailConfig, validEmail } from './booking-email-config';

/** Explicit safe projection: never pass the configuration object to a component. */
export function emailAdminStatus(operatorId: string, env: NodeJS.ProcessEnv = process.env) {
  const bound = env.PUBLIC_OPERATOR_ID === operatorId;
  const sender = bound ? env.RESEND_FROM_EMAIL?.trim() ?? '' : '';
  const match = sender.match(/^([^<>]+)<([^<>]+)>$/);
  const address = match?.[2] ?? sender;
  let ready = false;
  let siteConfigured = false;
  try { const site = new URL(env.NEXT_PUBLIC_SITE_URL ?? ''); siteConfigured = bound && ['http:','https:'].includes(site.protocol) && !site.username && !site.password && (env.APP_ENV !== 'production' || site.protocol === 'https:'); } catch { /* Missing or malformed URL. */ }
  if (bound) {
    try { ready = bookingEmailConfig({ ...env, EMAIL_ENABLED: 'true' }).enabled; } catch { /* Missing/invalid configuration. */ }
  }
  return {
    bound, enabled: bound && env.EMAIL_ENABLED === 'true', ready, siteConfigured,
    apiKeyConfigured: bound && Boolean(env.RESEND_API_KEY),
    cronConfigured: bound && (env.CRON_SECRET?.length ?? 0) >= 32,
    senderName: match?.[1].trim() ?? '', senderEmail: validEmail(address) ? address : '',
    senderDomain: validEmail(address) ? address.split('@')[1] : '',
    replyTo: bound && validEmail(env.BOOKING_REPLY_TO_EMAIL) ? env.BOOKING_REPLY_TO_EMAIL : '',
    ownerEmail: bound && validEmail(env.BOOKING_OWNER_EMAIL) ? env.BOOKING_OWNER_EMAIL : '',
    testRecipient: bound && validEmail(env.EMAIL_TEST_RECIPIENT) ? env.EMAIL_TEST_RECIPIENT : '',
    startConfigured: bound && Boolean(env.EMAIL_START_AT && Number.isFinite(Date.parse(env.EMAIL_START_AT))),
  };
}

export const emailEvents = [
  { type: 'BOOKING_CREATED', event: 'booking.confirmed', label: 'New booking' },
  { type: 'BOOKING_MODIFIED', event: 'booking.modified', label: 'Modified booking' },
  { type: 'BOOKING_CANCELLED', event: 'order.cancelled', label: 'Cancelled booking' },
] as const;
export const deliveryGroups = { pending: ['pending','leased','sending','retry'], sent: ['accepted'], failed: ['failed','uncertain'] };
export function deliveryLabel(status: string) {
  return ({pending:'Pending',leased:'Processing',sending:'Processing',retry:'Retry pending',accepted:'Sent (provider accepted)',failed:'Failed',uncertain:'Uncertain — review before resending',skipped:'Skipped'} as Record<string,string>)[status] ?? status;
}
