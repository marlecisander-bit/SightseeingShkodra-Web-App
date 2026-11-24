'use client';

import { useEffect, useState } from 'react';
import { SharedMap } from '@/modules/tracking/shared-map';
import { parseJourney, presentationTtl, type JourneySnapshot } from '@/modules/tracking/journey-contract';
import type { PublishedMap } from '@/modules/tracking/published-map';
import type { Snapshot } from '@/modules/tracking/positions';

type LiveMapResponse = { mapVersion: string | number | null; map: PublishedMap; snapshot: Snapshot; journey: unknown };

export function NativeRouteMap({ selectedStopId, onJourney, background = false, showFindVehicle = false }: {
  selectedStopId?: string;
  background?: boolean;
  showFindVehicle?: boolean;
  onJourney?: (value: JourneySnapshot | null, reason?: 'stale') => void;
}) {
  const [data, setData] = useState<LiveMapResponse>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    let expires: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch('/api/public/live-map', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Live map unavailable');
        const next: LiveMapResponse = await response.json();
        if (!controller.signal.aborted) {
          if (!background) setData(previous => ({
            ...next,
            map: previous && previous.mapVersion === next.mapVersion ? previous.map : next.map,
          }));
          setFailed(false);
          clearTimeout(expires);
          const journey = parseJourney(next.journey);
          const ttl = journey ? presentationTtl(journey) : 0;
          onJourney?.(ttl ? journey : null);
          if (ttl) expires = setTimeout(() => onJourney?.(null), ttl);
        }
      } catch {
        if (!controller.signal.aborted) {
          clearTimeout(expires);
          setFailed(true);
          onJourney?.(null, 'stale');
        }
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
      clearTimeout(expires);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [background, onJourney]);

  if (background) return null;
  if (!data) return <p role="status">{failed ? 'Live map temporarily unavailable.' : 'Loading live map…'}</p>;
  return <SharedMap mode="view" showFindVehicle={showFindVehicle} publishedMap={data.map} selectedStopId={selectedStopId}
    snapshot={failed ? { state: 'unavailable', positions: [] } : data.snapshot} />;
}
