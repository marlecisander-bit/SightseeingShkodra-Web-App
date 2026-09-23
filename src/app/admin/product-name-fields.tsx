"use client";

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
        Title
        <input name="title" required maxLength={200} value={title}
          onChange={event => setTitle(event.target.value)} />
      </label>
      <label>
        URL slug
        <input name="slug" required maxLength={200}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={customSlug ?? slugFromTitle(title)}
          onChange={event => setCustomSlug(event.target.value)}
          aria-describedby={helpId} />
      </label>
      <p id={helpId}>Generated from the title. You can edit it using lowercase letters, numbers and hyphens.</p>
      {customSlug !== null && (
        <button type="button" onClick={() => setCustomSlug(null)}>Use title for URL slug</button>
      )}
    </>
  );
}
