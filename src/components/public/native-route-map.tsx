'use client';

import { useEffect, useState } from 'react';
import { SharedMap } from '@/modules/tracking/shared-map';
import type { PublishedMap } from '@/modules/tracking/published-map';
import type { Snapshot } from '@/modules/tracking/positions';

type LiveMapResponse = { mapVersion: string | number | null; map: PublishedMap; snapshot: Snapshot };

export function NativeRouteMap({ selectedStopId }: { selectedStopId?: string }) {
  const [data, setData] = useState<LiveMapResponse>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch('/api/public/live-map', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Live map unavailable');
        const next: LiveMapResponse = await response.json();
        if (!controller.signal.aborted) {
          setData(previous => ({
            ...next,
            map: previous && previous.mapVersion === next.mapVersion ? previous.map : next.map,
          }));
          setFailed(false);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        pending = false;
      }
    }
    void refresh();
    const timer = setInterval(refresh, 10_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  if (!data) return <p role="status">{failed ? 'Live map temporarily unavailable.' : 'Loading live map…'}</p>;
  return <SharedMap mode="view" publishedMap={data.map} selectedStopId={selectedStopId}
    snapshot={failed ? { state: 'unavailable', positions: [] } : data.snapshot} />;
}
