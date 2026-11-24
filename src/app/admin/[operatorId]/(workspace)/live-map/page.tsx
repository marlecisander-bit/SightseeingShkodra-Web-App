import Link from 'next/link';
import { readPublicMap } from '@/modules/tracking/public-map-server';
import { freshRoutePosition } from '@/modules/tracking/route-itinerary';
import styles from './live-map.module.css';
import { trackingAdminEnabled, trackingAdminSession } from '@/modules/tracking/admin-server';
import { AdminSectionContext } from '../../../admin-workspace-context';
import { sectionAccess, type SectionProps } from '../../../section-access';
import { connectMapAccount, disconnectMapAccount } from '../../../tracking-map-actions';

const messages: Record<string, string> = {
  connected: 'Tracking account connected.',
  'password-reset': 'Live Map password updated. Sign in with the new password.',
  disconnected: 'Tracking account disconnected.',
  'connection-failed': 'Your Live Map session ended. Connect your tracking account again.',
  'invalid-credentials': 'The Live Map account email or password was rejected. Use the credentials from the former Live Map admin.',
  'email-not-confirmed': 'Confirm the email address for your Live Map account before signing in.',
  'tracking-access-denied': 'That account signed in successfully, but it has no administrator access to the Sightseeing Shkodra tracking project.',
  'connection-unavailable': 'The Live Map sign-in could not be completed. Try again shortly.',
  'try-later': 'Too many sign-in attempts. Wait a few minutes before trying again.',
};

export default async function Page(props: SectionProps) {
  const context = await sectionAccess('live-map', props);
  const operatorId = context.operatorId;
  const { result } = await props.searchParams;
  const enabled = trackingAdminEnabled(operatorId);
  const session = enabled ? await trackingAdminSession(operatorId).catch(() => null) : null;
  const tracking = enabled && !session ? await readPublicMap() : null;
  const observation = tracking?.snapshot.positions[0];
  const fresh = freshRoutePosition(observation);
  const workspaceUrl = `/admin/${encodeURIComponent(operatorId)}/live-map/workspace`;

  return <div className={styles.workspace}>
    <header>
      <h1>Live Map admin</h1>
      <Link href="/route" target="_blank" rel="noopener noreferrer">Open public route map</Link>
    </header>
    {enabled && !session && <section aria-label="Published map and GPS">
      <h2>Published map and GPS</h2>
      <p>{tracking?.mapVersion ? `Published map version ${tracking.mapVersion}` : 'Published map unavailable'}</p>
      <p>{fresh ? 'Receiving live van position' : 'No recent van position'}</p>
      {observation && <p>Last van update <time dateTime={observation.updatedAt}>{new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Tirane',
      }).format(new Date(observation.updatedAt))}</time> · Shkodra time</p>}
    </section>}
    {result && Object.hasOwn(messages, result) && <p role="status">{result === 'connected' && !session ? messages['connection-failed'] : messages[result]}</p>}
    {enabled ? <section>
      <h2>Map editing and publishing</h2>
      {!session ? <form action={connectMapAccount.bind(null, operatorId)}>
        <p>Use the account from the former Live Map admin. Your website staff account is separate.</p>
        <label>Tracking account email <input name="email" type="email" autoComplete="section-livemap username" required /></label>
        <label>Tracking account password <input name="password" type="password" autoComplete="section-livemap current-password" required /></label>
        <button type="submit">Connect tracking account</button>
        <Link href="/auth/live-map-recovery">Forgot your Live Map password?</Link>
      </form> : <>
        <form action={disconnectMapAccount.bind(null, operatorId)}><button type="submit">Disconnect tracking account</button></form>
        <Link href={`/admin/${encodeURIComponent(operatorId)}/departures?view=route`}>Back to Calendar</Link>
        <Link href={workspaceUrl} target="_blank" rel="noopener noreferrer">Open workspace in a new tab</Link>
      </>}
    </section> : <p>Map editing is unavailable for this workspace.</p>}
    {session && <iframe className={styles.editorFrame} src={workspaceUrl} title="Live Map editing workspace" />}
    <AdminSectionContext identity={context} />
  </div>;
}
