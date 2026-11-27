'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { LiveJourneyTracker } from './live-journey-tracker';
import { expireRouteStatus, routeStatusDeadline, type RouteStatus } from '@/modules/tracking/route-status';

const Context = createContext<{ journey: RouteStatus['journey']; stale: boolean; closed: boolean } | null>(null);

export function HomepageJourneyProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [status, setStatus] = useState<RouteStatus | null>(null);
  const [stale, setStale] = useState(false);
  const claim = useCallback((value: RouteStatus | null) => setStatus(value), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let busy = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    async function refresh() {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const response = await fetch('/api/public/route-tracking', {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]), cache: 'no-store',
        });
        if (!response.ok) throw new Error('Tracking unavailable');
        const next: RouteStatus = await response.json();
        if (controller.signal.aborted) return;
        if (next.mapVersion === null) throw new Error('Tracking unavailable');
        claim(expireRouteStatus(next));
        setStale(false);
      } catch {
        if (!controller.signal.aborted) { claim(null); setStale(true); }
      } finally { busy = false; }
    }

    function start() {
      if (timer) return;
      void refresh();
      timer = setInterval(refresh, 10_000);
      document.addEventListener('visibilitychange', refresh);
      window.addEventListener('online', refresh);
    }

    const section = document.getElementById('route');
    const observer = section && 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer?.disconnect();
        start();
      }) : null;
    if (observer && section) observer.observe(section);
    else start();

    return () => {
      controller.abort();
      observer?.disconnect();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', refresh);
    };
  }, [claim, enabled]);

  useEffect(() => {
    if (!status?.journey) return;
    const deadline = routeStatusDeadline(status);
    if (deadline === null) return;
    const timer = setTimeout(() => claim(expireRouteStatus(status)), Math.max(0, deadline - Date.now()) + 1);
    return () => clearTimeout(timer);
  }, [claim, status]);

  return <Context.Provider value={{ journey: enabled ? status?.journey ?? null : null, closed: enabled && status?.closed === true, stale: enabled && stale }}>{children}</Context.Provider>;
}

export function useHomepageJourney() { return useContext(Context); }

export function HomepageJourney(props: ComponentProps<typeof LiveJourneyTracker>) {
  const live = useHomepageJourney();
  return <LiveJourneyTracker {...props} cards showStatus journey={live?.journey} stale={live?.stale} closed={live?.closed} />;
}
