"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

/** Native modal supplies focus containment, Escape and an inert page behind the drawer. */
export function AdminNavigation({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  function close() { dialog.current?.close(); }
  useEffect(() => { dialog.current?.close(); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const resize = () => { if (desktop.matches) dialog.current?.close(); };
    desktop.addEventListener('change', resize);
    return () => desktop.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prior; };
  }, [open]);
  return <>
    <button ref={button} className={styles.mobileMenuButton} type="button" aria-label="Open Admin menu" aria-expanded={open} aria-controls="admin-menu" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <dialog ref={dialog} id="admin-menu" className={styles.mobileDrawer} aria-labelledby="admin-menu-title" onClose={() => { setOpen(false); button.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className={styles.drawerBody}>
        <div className={styles.drawerHeading}><strong id="admin-menu-title">Admin menu</strong><button type="button" onClick={close} aria-label="Close Admin menu">Close</button></div>
        <div onClick={event => { if ((event.target as HTMLElement).closest('a')) close(); }}>{children}</div>
      </div>
    </dialog>
  </>;
}
export function AdminConnectionStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update(); window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return offline ? <p className={styles.connectionNotice} role="alert">Connection lost. Some information may be out of date. Reconnect before saving.</p> : null;
}
