"use client";
import { Button } from "@/components/ui/button";

import { useId, useState } from "react";

function slugFromTitle(title: string) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 200).replace(/-+$/, "");
}

export function ProductNameFields() {
  const [title, setTitle] = useState("");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const helpId = useId();
  return (
    <>
      <label>
        Product name
        <input name="title" required maxLength={200} value={title}
          onChange={event => setTitle(event.target.value)} />
      </label>
      <details><summary>Advanced: page address</summary><label>
        Page address
        <input name="slug" required maxLength={200}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={customSlug ?? slugFromTitle(title)}
          onChange={event => setCustomSlug(event.target.value)}
          aria-describedby={helpId} />
      </label>
      <p id={helpId}>Created from the product name. Change only if you need a different page address. Use lowercase letters, numbers and hyphens.</p>
      {customSlug !== null && (
        <Button type="button" onClick={() => setCustomSlug(null)}>Use product name</Button>
      )}
      </details>
    </>
  );
}
