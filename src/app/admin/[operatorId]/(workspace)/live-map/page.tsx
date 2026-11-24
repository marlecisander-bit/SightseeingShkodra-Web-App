import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { readPublicMap } from '@/modules/tracking/public-map-server';
import { freshRoutePosition } from '@/modules/tracking/route-itinerary';
import styles from './live-map.module.css';
import { trackingWeekdays } from '@/modules/tracking/service-hours';
import { readTrackingHours, readTrackingVersions, trackingAdminEnabled, trackingAdminSession } from '@/modules/tracking/admin-server';
import { TrackingMapEditor } from '../../../tracking-map-editor';
import { AdminSectionContext } from '../../../admin-workspace-context';
import { sectionAccess, type SectionProps } from '../../../section-access';
import { connectMapAccount, disconnectMapAccount, saveTrackingHours, saveTrackingMap } from '../../../tracking-map-actions';

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
  'hours-saved': 'Van operating hours saved.',
  'hours-failed': 'Could not confirm the operating hours save. Review the saved hours before retrying.',
  'invalid-hours': 'Enter different opening and closing times for each selected day.',
  'draft-saved': 'Map draft saved.',
  published: 'Map published.',
  conflict: 'Another editor saved a newer map. Review that version before saving again.',
  invalid: 'The map or save request failed validation.',
  'save-failed': 'The tracking project could not confirm the save. Review the latest version before retrying.',
};

export default async function Page(props: SectionProps) {
  const context = await sectionAccess('live-map', props);
  const operatorId = context.operatorId;
  const { result } = await props.searchParams;
  const enabled = trackingAdminEnabled(operatorId);
  const [session, tracking] = enabled ? await Promise.all([
    trackingAdminSession(operatorId).catch(() => null),
    readPublicMap(),
  ]) : [null, null];
  const observation = tracking?.snapshot.positions[0];
  const fresh = freshRoutePosition(observation);
  const [versions, hours] = session ? await Promise.all([
    readTrackingVersions(session).catch(() => null),
    readTrackingHours(session).catch(() => null),
  ]) : [null, null];
  const save = saveTrackingMap.bind(null, operatorId);
  const versionFields = versions && <>
    <input type="hidden" name="head" value={versions.head?.id ?? ''} />
    <input type="hidden" name="published" value={versions.published ?? ''} />
    <input type="hidden" name="draft" value={versions.draft ?? ''} />
  </>;

  return <div className={styles.workspace}>
    <header>
      <h1>Live Map admin</h1>
      <Link href="/route" target="_blank" rel="noopener noreferrer">Open public route map</Link>
    </header>
    {enabled && <section aria-label="Published map and GPS">
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
        {versions ? <>
          <form action={save}>
            {versionFields}
            <input type="hidden" name="requestId" value={randomUUID()} />
            <TrackingMapEditor key={versions.head?.id ?? 'new'}
              initial={versions.head?.map_data ?? { type: 'FeatureCollection', features: [] }} />
          </form>
          {versions.head?.status === 'draft' && <form action={save}>
            {versionFields}
            <input type="hidden" name="requestId" value={randomUUID()} />
            <button name="status" value="published" type="submit">Publish saved draft</button>
          </form>}
        </> : <p role="status">Map versions are temporarily unavailable.</p>}
      </>}
    </section> : <p>Map editing is unavailable for this workspace.</p>}
    {session && <section>
      <h2>Van operating hours</h2>
      {hours ? <form action={saveTrackingHours.bind(null, operatorId)}>
        <p>Times are local to Shkodra. Overnight hours end the next day. GPS processing pauses outside enabled hours.</p>
        <label><input type="checkbox" name="enabled" defaultChecked={hours.enabled} /> Enable operating hours</label>
        <div className={styles.days}>{trackingWeekdays.map((day, index) => <fieldset key={day}>
          <legend>{day}</legend>
          <label><input type="checkbox" name={`day-${index}`} defaultChecked={hours.week[index] !== null} /> Operating day</label>
          <label> Opens <input type="time" name={`open-${index}`} defaultValue={hours.week[index]?.open} /></label>
          <label> Closes <input type="time" name={`close-${index}`} defaultValue={hours.week[index]?.close} /></label>
        </fieldset>)}</div>
        <button type="submit">Save operating hours</button>
      </form> : <p role="status">Operating hours are unavailable.</p>}
    </section>}
    <AdminSectionContext identity={context} />
  </div>;
}
