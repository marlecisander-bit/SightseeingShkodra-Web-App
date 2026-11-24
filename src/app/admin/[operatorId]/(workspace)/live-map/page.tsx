import Link from 'next/link';
import { NativeRouteMap } from '@/components/public/native-route-map';
import { AdminSectionContext } from '../../../admin-workspace-context';
import { sectionAccess, type SectionProps } from '../../../section-access';

export default async function Page(props: SectionProps) {
  const context = await sectionAccess('live-map', props);
  return <>
    <h1>Live Map</h1>
    {(process.env.LIVE_MAP_NATIVE_ROUTE === '1' && context.operatorId === process.env.PUBLIC_OPERATOR_ID)
      ? <NativeRouteMap />
      : <p>The live map preview is unavailable for this workspace.</p>}
    <p><Link href="/route">Open the public route map</Link></p>
    <AdminSectionContext identity={context} />
  </>;
}
