"use client";
import { ownerFieldLabel, positionLabels, imageUploadMessage } from "./presentation";
import { AmenitiesInput } from "./hero-amenities-input";
import { focalPositions } from "@/modules/content/hero-amenities";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { editableWebsiteSections, type WebsiteContent } from "@/modules/content/website-schema";
import { saveWebsiteSection, uploadWebsiteImage } from "./website-actions";
import styles from "./website-editor.module.css";
import { prepareWebsiteImage } from "@/modules/content/image-upload";

export function WebsiteSectionEditor({ operatorId, sectionId, content, stamp, values, setValues, onStateChange, onFeedback }: { operatorId: string; sectionId: string; content: WebsiteContent; stamp: string; values: WebsiteContent; setValues: Dispatch<SetStateAction<WebsiteContent>>; onStateChange?: (id: string, dirty: boolean, pending: boolean) => void; onFeedback?: (id: string, message: string) => void }) {
  const section = editableWebsiteSections.find(section => section.id === sectionId)!;
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const groups = sectionId==='whatsapp' ? [{title:'WhatsApp contact',fields:section.fields}] : [
    {title:"Content",fields:section.fields.filter(f=>f.kind!=="visibility" && !["image","position","link"].includes(f.kind) && !f.key.endsWith(".alt") && !/button|link label|scroll link/i.test(f.label))},
    {title:"Images",fields:section.fields.filter(f=>["image","position"].includes(f.kind)||f.key.endsWith(".alt"))},
    {title:"Buttons & links",fields:section.fields.filter(f=>f.kind==="link"||/button|link label|scroll link/i.test(f.label))},
  ];
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
      onFeedback?.(sectionId, result.error ?? result.saved ?? "");
      if (!result.error) router.refresh();
    });
  }}>
    {sectionId === "reviews" && <p><a href={`/admin/${operatorId}/reviews`}>Manage guest reviews and ordering</a>. This section is hidden until a review is published.</p>}
    {sectionId==='footer'&&<p>Leave a social link empty to hide it. Manage your Google Reviews link below.</p>}
    {sectionId==='whatsapp'&&<p>Use your WhatsApp Business number with its country code. Save Draft keeps changes private; Publish updates the website. Leave the button label empty to show only the icon.</p>}
    {sectionId==='navigation'&&<p>Desktop and mobile share these links. Route and Live map lead to the combined Route &amp; Live Map page. If several links lead to the same page, the first link supplies its label. Edit that first label to customize it; the original Route and Live map labels use the combined page name.</p>}
    {sectionId.startsWith('legal')&&<p>Plain text only. Add your approved legal wording, set Published, then publish. Unpublished pages show a neutral availability notice.</p>}
    <p>Save your changes as a draft or publish them when you’re ready.</p>
    {sectionId === "tourPage" && <p>FAQ questions below appear on the dedicated FAQ page. <a href={`/admin/${operatorId}/website-preview?page=faq`}>Preview saved FAQ draft</a></p>}
    {["intro","departures","tourPage"].includes(sectionId) && <p><a href={`/admin/${operatorId}/catalog`}>Products & suppliers</a> | <a href={`/admin/${operatorId}/departures`}>Calendar & Pricing</a>. Stops and live vehicle information are managed from Live Map.</p>}
    <input type="hidden" name="updated_at" value={stamp} />
    <fieldset disabled={pending}>
      {section.fields.filter(f=>f.kind==="visibility").map(f=><input key={f.key} type="hidden" name={f.key} value={values[f.key]}/>)}
      {groups.filter(group=>group.fields.length).map(group=><fieldset className={styles.fieldGroup} key={group.title}><legend>{group.title}</legend><div className={styles.fieldGrid}>{group.fields.map(field => {
        if (field.kind === "visibility") return <input key={field.key} type="hidden" name={field.key} value={values[field.key]} />;
        const long = field.kind === "legal" || field.kind === "amenities" || /text|detail|description|alt|message/.test(field.key) || /description/i.test(field.label) || field.initial.includes("\n");
        const heroImage = sectionId === "hero" && field.kind === "image";
        const mobileHero = heroImage && /mobile/i.test(field.key);
        return <div key={field.key} className={`${styles.field} ${long ? styles.fullField : ""} ${field.kind === "image" ? styles.imageField : ""}`}>
          {field.kind === "toggle" ? <label>{ownerFieldLabel(field.label)}<select name={field.key} value={values[field.key]} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))}><option value="true">On</option><option value="false">Off</option></select></label> : field.kind === "publication" ? <label>{ownerFieldLabel(field.label)}<select name={field.key} value={values[field.key]} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))}><option value="unpublished">Unpublished</option><option value="published">Published</option></select></label> : field.kind === "amenities" ? <AmenitiesInput value={values[field.key]} onChange={value=>setValues(v=>({...v,[field.key]:value}))}/> : field.kind === "position" ? <label>{ownerFieldLabel(field.label)}<select name={field.key} value={values[field.key]} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))}>{focalPositions.map(position=><option key={position} value={position}>{positionLabels[position]}</option>)}</select></label> : field.kind === "image" ? <>
            <strong>{ownerFieldLabel(field.label)}</strong>
            <div className={heroImage ? `${styles.heroPreview} ${mobileHero ? styles.heroPreviewMobile : styles.heroPreviewDesktop}` : undefined} style={heroImage ? {objectPosition: values[mobileHero ? "hero.mobilePosition" : "hero.desktopPosition"]} : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" className={styles.imagePreview} src={values[field.key]} alt={`Current ${ownerFieldLabel(field.label)}`} />
            </div>
            <label className={`${styles.replaceButton} ss-button`}>Replace image<input aria-label={`Upload / replace ${ownerFieldLabel(field.label)}`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => {
              const image = event.target.files?.[0]; if (!image) return;
              event.target.value = "";
              start(async () => {
                try {
                setMessage("Uploading image…");
                const prepared = await prepareWebsiteImage(image, sectionId === "hero");
                const data = new FormData(); data.set("image", prepared);
                const result = await uploadWebsiteImage(operatorId, data);
                if ("url" in result) { setValues(v => ({ ...v, [field.key]: result.url })); setMessage("Image uploaded. Save your draft or publish to use it."); }
                else setMessage(result.error ?? "Upload failed.");
                } catch (error) {
                  console.error("Admin image preparation failed", error);
                  setMessage(imageUploadMessage(error));
                }
              });
            }} /></label>
            <input type="hidden" name={field.key} value={values[field.key]} />
          </> : <label>{ownerFieldLabel(field.label)}
            {long ? <textarea rows={field.key.includes("alt") ? 2 : 3} name={field.key} required={!field.optional} maxLength={field.max} value={values[field.key]} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} />
              : <input type={field.kind === "external" ? "url" : field.kind === "phone" ? "tel" : "text"} name={field.key} required={!field.optional} maxLength={field.max} value={values[field.key]} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} />}
          </label>}
        </div>;
      })}</div></fieldset>)}
      {section.fields.some(f=>f.kind === "image") && <details><summary>Technical details</summary><p>For support: replace an existing image link without uploading a new file.</p>{section.fields.filter(f=>f.kind === "image").map(f=><label key={f.key}>{ownerFieldLabel(f.label)} link<input maxLength={f.max} value={values[f.key]} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))}/></label>)}</details>}
      <div className={styles.editorActions}>
        <span className={styles.helper}>{dirty ? "Unsaved changes" : "Saved content"}</span>
        <Button className={styles.textButton} type="button" disabled={!dirty} onClick={() => {setValues(current => ({...current, ...Object.fromEntries(section.fields.map(f => [f.key, content[f.key]]))})); setMessage("Unsaved changes discarded.");}}>Discard</Button>
        <Button className={styles.secondary} name="operation" value="draft">{pending ? "Saving…" : "Save Draft"}</Button>
        <Button className={styles.primary} name="operation" value="publish">Publish</Button>
      </div>
      <p className={styles.helper}>Publish applies this section and all previously saved website drafts.</p>
    </fieldset>
    {message && <p className={styles.notice} role="status">{message}</p>}
  </form>;
}
