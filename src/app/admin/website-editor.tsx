"use client";
import { AmenitiesInput } from "./hero-amenities-input";
import { focalPositions } from "@/modules/content/hero-amenities";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editableWebsiteSections, type WebsiteContent } from "@/modules/content/website-schema";
import { saveWebsiteSection, uploadWebsiteImage } from "./website-actions";
import styles from "./website-editor.module.css";
import { prepareWebsiteImage } from "@/modules/content/image-upload";

export function WebsiteSectionEditor({ operatorId, sectionId, content, stamp, onStateChange }: { operatorId: string; sectionId: string; content: WebsiteContent; stamp: string; onStateChange?: (id: string, dirty: boolean, pending: boolean) => void }) {
  const section = editableWebsiteSections.find(section => section.id === sectionId)!;
  const [values, setValues] = useState(content);
  const [message, setMessage] = useState("");
  const [sizes, setSizes] = useState<Record<string,string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const dirty = section.fields.some(f => values[f.key] !== content[f.key]);
  useEffect(() => { onStateChange?.(sectionId, dirty, pending); }, [sectionId, dirty, pending, onStateChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return <form id={`cms-form-${sectionId}`} className={styles.editor} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    start(async () => {
      const result = await saveWebsiteSection(operatorId, sectionId, data);
      setMessage(result.error ?? result.saved ?? "");
      if (!result.error) router.refresh();
    });
  }}>
    {sectionId === "reviews" && <p><a href={`/admin/${operatorId}/reviews`}>Manage guest reviews, ordering and Google links</a>. This section is hidden until a review is published.</p>}
    <p>Section: {section.title}. Saved drafts appear in Preview; Publish updates the public website without a rebuild.</p>
    {["intro","departures","tourPage"].includes(sectionId) && <p>Operational data: <a href={`/admin/${operatorId}/catalog`}>Manage product and price</a> | <a href={`/admin/${operatorId}/departures`}>Manage service schedule and capacity</a>. Boarding points, route order and GPS are managed in the independent map app.</p>}
    <input type="hidden" name="updated_at" value={stamp} />
    <fieldset disabled={pending}>
      <div className={styles.fieldGrid}>{section.fields.map(field => {
        const long = field.kind === "amenities" || /text|detail|description|alt/.test(field.key) || /description/i.test(field.label) || field.initial.includes("\n");
        return <div key={field.key} className={`${styles.field} ${long ? styles.fullField : ""} ${field.kind === "image" ? styles.imageField : ""}`}>
          {field.kind === "amenities" ? <AmenitiesInput value={values[field.key]} onChange={value=>setValues(v=>({...v,[field.key]:value}))}/> : field.kind === "position" ? <label>{field.label}<select name={field.key} value={values[field.key]} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))}>{focalPositions.map(position=><option key={position}>{position}</option>)}</select></label> : field.kind === "image" ? <>
            <strong>{field.label}</strong>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.imagePreview} ref={image => { if (image?.complete && image.naturalWidth) { const size = `${image.naturalWidth} × ${image.naturalHeight} px`; setSizes(s => s[field.key] === size ? s : {...s, [field.key]: size}); } }} src={values[field.key]} alt={`Current ${field.label}`} onLoad={event => { const size = `${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight} px`; setSizes(s => s[field.key] === size ? s : {...s, [field.key]: size}); }} />
            <p className={styles.imageMeta}>{values[field.key].split("/").pop()}<span>{sizes[field.key] ?? "Loading dimensions…"}</span></p>
            <label className={`${styles.replaceButton} ss-button`}>Replace image<input aria-label={`Upload / replace ${field.label}`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => {
              const image = event.target.files?.[0]; if (!image) return;
              event.target.value = "";
              start(async () => {
                try {
                setMessage(sectionId === "hero" ? "Preparing hero image for upload…" : "Uploading image…");
                const prepared = await prepareWebsiteImage(image, sectionId === "hero");
                const data = new FormData(); data.set("image", prepared);
                const result = await uploadWebsiteImage(operatorId, data);
                if ("url" in result) { setValues(v => ({ ...v, [field.key]: result.url })); setMessage("Image uploaded. Save Draft or Publish to use it."); }
                else setMessage(result.error ?? "Upload failed.");
                } catch (error) {
                  setMessage(error instanceof Error && !/server|fetch|network|body|413/i.test(error.message) ? error.message : "The image could not be uploaded. Check your connection and try again. Your edits are still here.");
                }
              });
            }} /></label>
            <small className={styles.helper}>{sectionId === "hero" ? "No original file-size limit. Large hero images are automatically optimized for the web." : "JPEG, PNG, WebP or AVIF · Maximum 8 MB per image."}</small>
            <details className={styles.imagePath}><summary>Image source / existing image</summary><label>{field.label} path<input name={field.key} required maxLength={field.max} value={values[field.key]} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} /></label></details>
            <small className={styles.helper}>Required image · Replace to change it. Alt text is editable below.</small>
          </> : <label>{field.label}
            {long ? <textarea rows={field.key.includes("alt") ? 2 : 3} name={field.key} required maxLength={field.max} value={values[field.key]} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} />
              : <input name={field.key} required maxLength={field.max} value={values[field.key]} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} />}
          </label>}
        </div>;
      })}</div>
      <div className={styles.editorActions}>
        <span className={styles.helper}>{dirty ? "Unsaved changes" : "Saved content"}</span>
        <Button className={styles.textButton} type="button" disabled={!dirty} onClick={() => {setValues(content); setMessage("Unsaved changes discarded.");}}>Discard</Button>
        <Button className={styles.secondary} name="operation" value="draft">{pending ? "Saving…" : "Save Draft"}</Button>
        <Button className={styles.primary} name="operation" value="publish">Publish</Button>
      </div>
      <p className={styles.helper}>Publish applies this section and all previously saved website drafts.</p>
    </fieldset>
    {message && <p className={styles.notice} role="status">{message}</p>}
  </form>;
}
