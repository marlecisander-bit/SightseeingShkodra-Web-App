"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import styles from "./catalog.module.css";

export function CatalogCreate({ entity, label, settings = false, children }: { entity?: string; label?: string; settings?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className={styles.create}>
    <Button className={settings ? styles.settings : undefined} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <span aria-hidden="true">{settings ? "⚙ " : "+ "}</span>{label ?? `Create ${entity}`}
    </Button>
    <div id={id} hidden={!open} className={styles.createForm}>{children}</div>
  </div>;
}
