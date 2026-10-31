import { parseJourney, presentationTtl, type JourneySnapshot } from './journey-contract';

/** Transport lifecycle only: all operational facts remain upstream. */
export function connectJourneyBridge(host: Window, source: () => Window | null, origin: string,
  receive: (snapshot: JourneySnapshot | null, reason?: 'stale' | 'loading') => void, externalDisplay = false) {
  let expires: ReturnType<typeof setTimeout> | undefined;
  let connected = false;
  let disposed = false;
  const request = () => source()?.postMessage({ type: 'shkodra:request-journey', version: 1, ...(externalDisplay ? {embeddedDisplayVersion: 1} : {}) }, origin);
  const reset = () => {
    if (disposed) return;
    connected = false;
    clearTimeout(expires);
    receive(null, 'loading');
    request();
  };
  const listener = (event: MessageEvent) => {
    if (disposed || event.origin !== origin || !source() || event.source !== source()) return;
    const snapshot = parseJourney(event.data);
    if (!snapshot || (externalDisplay && !snapshot.embeddedDisplay)) return;
    const ttl = presentationTtl(snapshot);
    if (ttl <= 0) {
      if (connected) { clearTimeout(expires); connected = false; receive(null, 'stale'); }
      return;
    }
    connected = true;
    clearTimeout(expires);
    receive(snapshot);
    expires = setTimeout(() => {
      connected = false;
      receive(null, 'stale');
      request();
    }, ttl);
  };
  host.addEventListener('message', listener);
  // Retry only the presentation handshake, never poll a tracking source.
  const retry = setInterval(() => { if (!connected) request(); }, 3000);
  request();
  return { reset, dispose() {
    disposed = true;
    host.removeEventListener('message', listener);
    clearTimeout(expires);
    clearInterval(retry);
  } };
}
