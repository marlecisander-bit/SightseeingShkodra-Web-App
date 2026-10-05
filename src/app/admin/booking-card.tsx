"use client";
import { useState, type ReactNode } from 'react';
import { usePanelHistory } from './use-panel-history';
import styles from './admin.module.css';

export function BookingCard({ id, initiallyOpen, summary, children }: { id: string; initiallyOpen: boolean; summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(initiallyOpen);
  const history = usePanelHistory(`booking:${id}`, value => setOpen(value === id));
  return <details id={`booking-${id}`} className={styles.bookingCard} open={open}>
    <summary className={styles.bookingSummary} onClick={event => {
      event.preventDefault();
      if (open) history.close();
      else { history.open(id); setOpen(true); }
    }}>{summary}</summary>
    {children}
  </details>;
}
