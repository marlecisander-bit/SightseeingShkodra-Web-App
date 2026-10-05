/** Scheduler adapter only. All queueing/sending remains in the existing Next.js worker. */
export async function invokeEmailWorker(context, env = process.env, transport = fetch) {
  if (context?.deploy?.context !== 'production' || context.deploy.published !== true || env.APP_ENV !== 'production') return {status:'not_production'};
  if (env.EMAIL_ENABLED !== 'true') return {status:'disabled'};
  if (!env.CRON_SECRET || env.CRON_SECRET.length < 32) throw Error('email_scheduler_configuration');
  let site, configured;
  try { site = new URL(context.site.url); configured = new URL(env.NEXT_PUBLIC_SITE_URL); } catch { throw Error('email_scheduler_configuration'); }
  if (site.protocol !== 'https:' || configured.origin !== site.origin || site.username || site.password) throw Error('email_scheduler_configuration');
  try {
    const response = await transport(new URL('/api/internal/booking-emails', site.origin), {
      method:'GET', headers:{Authorization:`Bearer ${env.CRON_SECRET}`}, redirect:'error', cache:'no-store', signal:AbortSignal.timeout(25000),
    });
    if (!response.ok) throw Error();
    const body = await response.json();
    if (!['disabled','test','live'].includes(body.status) || !Number.isInteger(body.processed) || body.processed < 0 || body.processed > 4) throw Error();
    return {status:body.status,processed:body.processed};
  } catch { throw Error('email_scheduler_worker_unconfirmed'); }
}
export default async function bookingEmailSchedule(_request, context) {
  const result = await invokeEmailWorker(context);
  console.info(JSON.stringify({component:'booking_email_schedule',...result}));
}
export const config = {schedule:'* * * * *'};
