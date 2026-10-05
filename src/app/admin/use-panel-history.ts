"use client";

import { useCallback, useEffect, useRef } from 'react';

/** One same-page history entry for a focused editor; no request or data reload. */
export function usePanelHistory(key: string, restore: (value: string | null) => void, canLeave: () => boolean = () => true) {
  const field = `admin-panel:${key}`;
  const restoring = useRef(false);
  const prefix = `#${encodeURIComponent(field)}=`;
  const current = useCallback(() => {
    if (!window.location.hash.startsWith(prefix)) return null;
    try { return decodeURIComponent(window.location.hash.slice(prefix.length)); } catch { return null; }
  }, [prefix]);
  useEffect(() => {
    const pathname = window.location.pathname;
    function onPop() {
      if (window.location.pathname !== pathname) return;
      if (restoring.current) { restoring.current = false; return; }
      if (!canLeave()) { restoring.current = true; window.history.forward(); return; }
      restore(current());
    }
    window.addEventListener('hashchange', onPop);
    return () => window.removeEventListener('hashchange', onPop);
  }, [current, restore, canLeave]);
  return {
    open(value: string) {
      const url = new URL(window.location.href);
      url.hash = `${prefix.slice(1)}${encodeURIComponent(value)}`;
      if (current()) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    },
    close() {
      if (!canLeave()) return;
      if (current()) window.history.back();
      else restore(null);
    },
  };
}
