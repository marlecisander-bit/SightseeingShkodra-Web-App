import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { NativeRouteMap } from '@/components/public/native-route-map';
import { readTrackingVersions, trackingAdminEnabled, trackingAdminSession } from '@/modules/tracking/admin-server';
import { AdminSectionContext } from '../../../admin-workspace-context';
import { sectionAccess, type SectionProps } from '../../../section-access';
import { connectMapAccount, disconnectMapAccount, saveTrackingMap } from '../../../tracking-map-actions';

const messages: Record<string, string> = {
  connected: 'Tracking account connected.',
  disconnected: 'Tracking account disconnected.',
  'connection-failed': 'Could not connect an authorized tracking account.',
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
  const session = enabled ? await trackingAdminSession(operatorId).catch(() => null) : null;
  const versions = session ? await readTrackingVersions(session).catch(() => null) : null;
  const save = saveTrackingMap.bind(null, operatorId);
  const versionFields = versions && <>
    <input type="hidden" name="head" value={versions.head?.id ?? ''} />
    <input type="hidden" name="published" value={versions.published ?? ''} />
    <input type="hidden" name="draft" value={versions.draft ?? ''} />
  </>;

  return <>
    <h1>Live Map</h1>
    {process.env.LIVE_MAP_NATIVE_ROUTE === '1' && operatorId === process.env.PUBLIC_OPERATOR_ID && <NativeRouteMap />}
    {result && Object.hasOwn(messages, result) && <p role="status">{messages[result]}</p>}
    {enabled ? <section>
      <h2>Map editing and publishing</h2>
      {!session ? <form action={connectMapAccount.bind(null, operatorId)}>
        <p>Connect your existing Live Map account to edit or publish the map.</p>
        <label>Tracking account email <input name="email" type="email" autoComplete="username" required /></label>
        <label>Tracking account password <input name="password" type="password" autoComplete="current-password" required /></label>
        <button type="submit">Connect tracking account</button>
      </form> : <>
        <form action={disconnectMapAccount.bind(null, operatorId)}><button type="submit">Disconnect tracking account</button></form>
        {versions ? <>
          <form action={save}>
            {versionFields}
            <input type="hidden" name="requestId" value={randomUUID()} />
            <label>Map GeoJSON <textarea name="geojson" rows={16} cols={65} required maxLength={500000}
              defaultValue={JSON.stringify(versions.head?.map_data ?? { type: 'FeatureCollection', features: [] }, null, 2)} /></label>
            <button name="status" value="draft" type="submit">Save draft</button>
          </form>
          {versions.head?.status === 'draft' && <form action={save}>
            {versionFields}
            <input type="hidden" name="requestId" value={randomUUID()} />
            <button name="status" value="published" type="submit">Publish saved draft</button>
          </form>}
        </> : <p role="status">Map versions are temporarily unavailable.</p>}
      </>}
    </section> : <p>Map editing is unavailable for this workspace.</p>}
    <p><Link href="/route">Open the public route map</Link></p>
    <AdminSectionContext identity={context} />
  </>;
}
