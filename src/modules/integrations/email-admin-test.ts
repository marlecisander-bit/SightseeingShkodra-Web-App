import 'server-only';
import { createHash } from 'node:crypto';
import { requirePermission } from '../identity/require-permission';
import { bookingEmailConfig, validEmail } from './booking-email-config';
import { bookingEmailPreview } from './booking-email-preview';
import { sendResendEmail } from './resend-provider';

/** Synthetic, owner-authorized diagnostic. Never drains or inserts into the booking queue. */
export async function sendAdminTestEmail(operatorId: string, recipient: string, dependencies = {
  authorize: requirePermission, send: sendResendEmail, env: process.env, now: Date.now,
}, recipientType: 'customer' | 'owner' = 'customer') {
  await dependencies.authorize(operatorId, 'integrations.manage');
  const env = dependencies.env;
  if (!['customer','owner'].includes(recipientType) || env.VERCEL_ENV === 'preview') throw Error('test_unavailable');
  const allowed = env.EMAIL_TEST_RECIPIENT?.trim();
  if (!validEmail(recipient) || !allowed || recipient !== allowed || env.PUBLIC_OPERATOR_ID !== operatorId) throw Error('test_unavailable');
  // An explicit test may run while automatic booking delivery remains disabled.
  const config = bookingEmailConfig({ ...env, EMAIL_ENABLED: 'true' });
  if (!config.enabled || !config.testRecipient) throw Error('test_unavailable');
  const template = { ...bookingEmailPreview('BOOKING_CREATED', recipientType, config.siteUrl), subject: '[TEST] Sightseeing Shkodra — Email System Test ? '+recipientType };
  const bucket = Math.floor(dependencies.now() / 300000);
  const identity = createHash('sha256').update(JSON.stringify([operatorId,recipient,config.from,config.replyTo,template,bucket])).digest('hex');
  const result = await dependencies.send(config.apiKey, `admin-email-test/${identity}`, {
    from: config.from, to: [config.testRecipient], reply_to: config.replyTo, ...template,
  });
  if (result.outcome !== 'accepted') throw Error('test_unavailable');
  return { accepted: true };
}
