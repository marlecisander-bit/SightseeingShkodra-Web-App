"use client";
import { useRef, useState, type ReactNode } from "react";
import styles from "./admin.module.css";

export function AdminNavigation({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return <div className={styles.navigation} data-open={open} onKeyDown={event => {
    if (event.key === "Escape" && open) { setOpen(false); button.current?.focus(); }
  }}>
    <button ref={button} className={styles.navigationToggle} type="button" aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen(!open)}>{open ? "Close menu" : "Admin menu"}</button>
    <div id="admin-menu" className={styles.navigationContent} onClick={event => {
      if ((event.target as HTMLElement).closest("a")) setOpen(false);
    }}>{children}</div>
  </div>;
}
