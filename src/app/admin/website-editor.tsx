"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { websiteSections, type WebsiteContent } from "@/modules/content/website-schema";
import { saveWebsiteSection, uploadWebsiteImage } from "./website-actions";
import styles from "./website-editor.module.css";

export function WebsiteSectionEditor({ operatorId, sectionId, content, stamp }: { operatorId: string; sectionId: string; content: WebsiteContent; stamp: string }) {
  const section = websiteSections.find(section => section.id === sectionId)!;
  const [values, setValues] = useState(content);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return <form className={styles.editor} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    start(async () => {
      const result = await saveWebsiteSection(operatorId, sectionId, data);
      setMessage(result.error ?? result.saved ?? "");
      if (!result.error) router.refresh();
    });
  }}>
    <input type="hidden" name="updated_at" value={stamp} />
    <fieldset disabled={pending}>
      {section.fields.map(field => <div key={field.key} className={styles.field}>
        {field.kind === "image" && <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.thumbnail} src={values[field.key]} alt={`Current ${field.label}`} />
          <label>Upload / replace {field.label}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => {
            const image = event.target.files?.[0];
            if (!image) return;
            const data = new FormData(); data.set("image", image);
            start(async () => {
              const result = await uploadWebsiteImage(operatorId, data);
              if ("url" in result) { setValues(v => ({ ...v, [field.key]: result.url })); setMessage("Image uploaded. Save Draft or Publish to use it."); }
              else setMessage(result.error ?? "Upload failed.");
            });
          }} /></label>
        </>}
        <label>{field.label}
          {field.kind === "text" ? <textarea rows={field.key.endsWith(".text") || field.key.endsWith(".detail") ? 3 : 2} name={field.key} required maxLength={field.max} value={values[field.key]} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} />
            : <input name={field.key} required maxLength={field.max} value={values[field.key]} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} />}
        </label>
      </div>)}
      <div className={styles.actions}>
        <button name="operation" value="draft">{pending ? "Saving…" : "Save Draft"}</button>
        <a href={`/admin/${operatorId}/website-preview`} target="_blank" rel="noopener noreferrer">Preview saved draft</a>
        <button name="operation" value="publish">Publish</button>
      </div>
      <p>Publish applies this section and all previously saved homepage drafts. Preview the saved draft first.</p>
    </fieldset>
    {message && <p role="status">{message}</p>}
  </form>;
}
