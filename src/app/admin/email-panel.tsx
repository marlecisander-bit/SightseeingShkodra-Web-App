import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { getEmailAdmin } from '@/modules/integrations/email-admin-server';
import { deliveryLabel, emailEvents } from '@/modules/integrations/email-admin-status';
import { bookingEmailPreview } from '@/modules/integrations/booking-email-preview';
import { workerHealth } from '@/modules/integrations/email-worker-heartbeat';
import { resendConfirmation } from './booking-actions';
import { MutationForm } from './mutation-form';
import { SubmitButton } from './submit-button';
import { EmailTestForm } from './email-test-form';
import { Button } from '@/components/ui/button';
import styles from './email-panel.module.css';

const date = (value:string|null) => value ? new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Tirane'}).format(new Date(value)) : 'No recorded activity';
export async function EmailPanel({operatorId,delivery,recipient}:{operatorId:string;delivery?:string;recipient?:string}) {
  let data;
  try { data=await getEmailAdmin(operatorId,delivery,recipient); }
  catch { return <section className={styles.card}><h2>Email activity unavailable</h2><p>Please refresh or contact your administrator. Delivery status is temporarily unavailable.</p></section>; }
  return <EmailPanelView operatorId={operatorId} data={data} delivery={delivery} recipient={recipient}/>;
}

export function EmailPanelView({operatorId,data,delivery,recipient}:{operatorId:string;data:Awaited<ReturnType<typeof getEmailAdmin>>;delivery?:string;recipient?:string}) {
  const c=data.config, enabled=c.enabled&&c.ready;
  return <div className={styles.layout}>
    {!c.enabled&&<section className={`${styles.card} ${styles.warning}`} role="status"><strong>Automatic booking emails are currently disabled.</strong><p>Bookings remain valid. Email setup needs attention before automatic messages can be sent.</p></section>}
    {!c.bound&&<p role="status">Email sending is not set up for this workspace.</p>}
    <div className={styles.grid}>
      <section className={styles.card}><h2>Email service</h2><dl>
        <dt>Provider</dt><dd>Resend</dd><dt>System</dt><dd>{c.enabled?'Enabled':'Disabled'}</dd>
        <dt>Configuration</dt><dd>{c.ready?'Ready':'Incomplete'}</dd>
        <dt>Sender domain</dt><dd>{c.senderDomain?`Configured: ${c.senderDomain}`:'Not configured'}</dd>
        <dt>Automatic sending setup</dt><dd>{c.ready&&c.cronConfigured?'Ready':'Needs configuration'}</dd>
        <dt>Last successful email</dt><dd>{date(data.lastAccepted)} (provider acceptance)</dd>
        <dt>Last failed / uncertain email</dt><dd>{date(data.lastFailed)}</dd>
      </dl><p>Domain verification and inbox delivery cannot be confirmed here. Times are Europe/Tirane.</p></section>
      <details className={styles.card}><summary>Advanced email configuration</summary><dl>
        <dt>Resend API key</dt><dd>{c.apiKeyConfigured?'Configured':'Configuration required'}</dd>
        <dt>Cron secret</dt><dd>{c.cronConfigured?'Configured':'Configuration required'}</dd>
        <dt>Activation timestamp</dt><dd>{c.startConfigured?'Configured':'Configuration required'}</dd>
        <dt>Workspace binding</dt><dd>{c.bound?'Configured':'Configuration required'}</dd>
        <dt>Public website URL</dt><dd>{c.siteConfigured?'Configured':'Configuration required'}</dd>
        <dt>Test recipient</dt><dd>{c.testRecipient?'Configured':'Not configured — required for test sends and non-production delivery'}</dd>
        <dt>Email sending</dt><dd>{c.enabled?'Enabled':'Disabled'}</dd>
      </dl>{!c.apiKeyConfigured&&<p>Resend API configuration required.</p>}
      {(!c.senderEmail||!c.replyTo||!c.ownerEmail)&&<p>Sender configuration required.</p>}
      <p>Keys, sending switch, sender addresses, activation timestamp and test address are managed in server configuration. Secret values are never displayed. Configured means present; it does not verify provider credentials.</p>
      <h3>Available in admin</h3><p>Inspect activity, filter deliveries, preview templates, test the configured address and request an existing confirmation resend.</p></details>
    </div>
    <section className={styles.card}><h2>Sender settings</h2><p>Your current sending addresses. Contact your administrator to change them.</p><dl>
      <dt>Sender name</dt><dd>{c.senderName||'Not configured'}</dd><dt>Sender email</dt><dd>{c.senderEmail||'Not configured'}</dd>
      <dt>Reply-to email</dt><dd>{c.replyTo||'Not configured'}</dd><dt>Owner notification email</dt><dd>{c.ownerEmail||'Not configured'}</dd>
    </dl><p><strong>Sender:</strong> the address customers see. <strong>Reply-to:</strong> where customer replies go. <strong>Owner notification:</strong> where your business receives booking notifications.</p></section>
    <div className={`${styles.grid} ${styles.events}`}>{data.events.map(event=><section className={styles.card} key={event.type}><h2>{event.label}</h2><dl>
      <dt>Customer email</dt><dd>{enabled?'Enabled':'Disabled / not ready'}</dd><dt>Owner email</dt><dd>{enabled?'Enabled':'Disabled / not ready'}</dd><dt>Template available</dt><dd>Yes</dd>
    </dl><p>{event.sent} accepted · {event.failed} failed / uncertain · {event.pending} pending / processing</p><p>These messages follow the shared email sending setting.</p></section>)}</div>
    <section className={styles.card}><h2>Recent messages</h2><p>Booking messages for guests and the owner. Sent means accepted by the email service; inbox delivery is not verified.</p>
      <form className={styles.filters} method="get"><label>Status<select name="delivery" defaultValue={delivery??''}><option value="">All</option><option value="pending">Pending</option><option value="sent">Sent</option><option value="failed">Failed</option></select></label><label>Recipient<select name="recipient" defaultValue={recipient??''}><option value="">All recipients</option><option value="customer">Customer</option><option value="owner">Owner</option></select></label><Button type="submit">Apply filters</Button></form>
      {data.rows.length===0?<p>No matching email deliveries.</p>:<ul className={styles.activity}>{data.rows.map(row=><li key={row.id}>
        <Link href={`/admin/${operatorId}/bookings?booking=${row.booking_id}#booking-${row.booking_id}`}>{row.booking_reference??'Open booking'}</Link>
        <dl><dt>Date</dt><dd>{date(row.created_at)}</dd><dt>Event</dt><dd>{emailEvents.find(e=>e.type===row.event_type)?.label??row.event_type}</dd><dt>Recipient</dt><dd>{row.recipient_type}</dd><dt>Status</dt><dd><span className={styles.badge}>{deliveryLabel(row.status)}</span></dd><dt>Attempts</dt><dd>{row.attempt_count}</dd></dl>
        {enabled&&data.resendable.includes(row.booking_id)&&(row.status==='failed'||row.status==='uncertain')&&<MutationForm action={resendConfirmation.bind(null,operatorId,row.booking_id)}>
          <input type="hidden" name="request_id" value={randomUUID()}/><label><span><input style={{width:'auto',minHeight:24}} type="checkbox" name="confirm" value="yes" required/> I checked the provider result and want a new confirmation.</span></label>
          <p>This reuses the booking resend: it queues customer and owner confirmations, not a replay of this individual event. Five-minute cooldown applies.</p><SubmitButton>Resend confirmation</SubmitButton>
        </MutationForm>}
      </li>)}</ul>}<p>Showing up to 100 recent matching messages. Skipped messages appear under All.</p></section>
    <div className={styles.grid}>
      <details className={styles.card}><summary>Advanced: send a test email</summary><EmailTestForm operatorId={operatorId} recipient={c.testRecipient} ready={c.ready&&Boolean(c.testRecipient)}/><p>Synthetic test sends are not booking-delivery records. Check the result here and the provider dashboard.</p></details>
      <details className={styles.card}><summary>Advanced: automatic sending status</summary><dl><dt>Email worker</dt><dd>{workerHealth(data.heartbeat,enabled)}</dd><dt>Last run started</dt><dd>{date(data.heartbeat?.started_at??null)}</dd><dt>Last run completed</dt><dd>{date(data.heartbeat?.finished_at??null)}</dd><dt>Last successful run</dt><dd>{date(data.heartbeat?.last_success_at??null)}</dd><dt>Pending queue</dt><dd>{data.pending}</dd><dt>Failed / uncertain</dt><dd>{data.events.reduce((sum,e)=>sum+e.failed,0)}</dd></dl>
      {!data.heartbeatAvailable&&<p>Heartbeat storage unavailable. Apply the worker-readiness migration before activation.</p>}
      {!data.heartbeat&&<p>Scheduler status cannot yet be verified: no worker execution has been recorded.</p>}
      <p>Operational means the worker completed within the last three minutes, even if the queue was empty. It does not prove inbox delivery or future scheduler execution. Refresh this page for current status.</p><p>The Netlify schedule calls the existing protected worker once per minute after production activation.</p></details>
    </div>
    <section className={styles.card}><h2>Email templates</h2><p>Version 1 · synthetic data only. Previewing does not send mail.</p><div className={styles.grid}>{emailEvents.flatMap(event=>(['customer','owner'] as const).map(recipient=><details key={`${event.type}-${recipient}`}><summary>Preview: {event.label} — {recipient}</summary><iframe className={styles.preview} title={`${event.label} ${recipient} email preview`} sandbox="" srcDoc={bookingEmailPreview(event.type,recipient).html}/></details>))}</div></section>
  </div>;
}
