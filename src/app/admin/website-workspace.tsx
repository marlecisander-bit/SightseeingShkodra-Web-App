"use client";
import { Button, ButtonContent } from "@/components/ui/button";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import type { WebsiteRecord } from "@/modules/content/website-server";
import { websiteEditorGroups } from "@/modules/content/website-schema";
import { WebsiteSectionEditor } from "./website-editor";
import styles from "./website-editor.module.css";

export function WebsiteWorkspace({ operatorId, record, destinationManager }: { operatorId: string; record: WebsiteRecord; destinationManager: ReactNode }) {
  const [scope, setScope] = useState<keyof typeof websiteEditorGroups>("homepage");
  const websiteSections = websiteEditorGroups[scope];
  const [active, setActive] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, { dirty: boolean; pending: boolean }>>({});
  const [notice, setNotice] = useState("");
  const onStateChange = useCallback((id: string, dirty: boolean, pending: boolean) => setStates(current => current[id]?.dirty === dirty && current[id]?.pending === pending ? current : { ...current, [id]: { dirty, pending } }), []);
  const content = record.body.content;
  const changed = websiteSections.some(s => s.fields.some(f => content[f.key] !== record.published_body?.content[f.key]));
  const unsaved = Object.values(states).some(s => s.dirty);
  const pending = Object.values(states).some(s => s.pending);
  const selected = websiteSections.find(s => s.id === active) ?? websiteSections[0];
  const image = selected.fields.find(f => f.kind === "image");
  const preview = `/admin/${operatorId}/website-preview?page=${({how:"tour",tourPage:"tour",explorePage:"explore",bookPage:"book",dayPage:"your-day"} as Record<string,string>)[selected.id]??"home"}`;
  function select(id: string, jump = false) {
    if (pending || (active && states[active]?.dirty && (active !== id || !jump))) { setNotice("Save or discard your current edits before opening another section."); return; }
    setNotice(""); setActive(active === id && !jump ? null : id);
    if (jump) requestAnimationFrame(() => { const el = document.getElementById(`cms-${id}`); el?.scrollIntoView({ block: "start", behavior: "smooth" }); el?.querySelector("summary")?.focus(); });
  }
  if(scope==="destinations") return <section className={styles.cms}><Button onClick={()=>setScope("homepage")}>Back to website content</Button>{destinationManager}</section>;
  return <section className={styles.cms}>
    <header className={styles.toolbar}>
      <div><p className={styles.breadcrumb}>Website / {({homepage:"Homepage",destinations:"Destinations",pages:"Public pages",global:"Global"})[scope]}</p><h1>{({homepage:"Homepage content",destinations:"Destination content",pages:"Public page content",global:"Global website content"})[scope]}</h1><p className={styles.subtitle}>Manage what visitors see on your website.</p></div>
      <div className={styles.toolbarActions}>
        <a className={`${styles.textButton} ss-button`} href="/" target="_blank" rel="noopener noreferrer"><ButtonContent>View Website</ButtonContent></a>
        <a className={`${styles.secondary} ss-button`} href={preview} target="_blank" rel="noopener noreferrer"><ButtonContent>Preview</ButtonContent></a>
        {unsaved && <Button className={styles.secondary} form={`cms-form-${active ?? websiteSections[0].id}`} name="operation" value="draft" disabled={pending}>Save Draft</Button>}
        <Button className={styles.primary} form={`cms-form-${active ?? websiteSections[0].id}`} name="operation" value="publish" disabled={pending}>{pending ? "Saving…" : "Publish"}</Button>
      </div>
      <div className={styles.toolbarStatus} role="status"><span className={changed || unsaved ? styles.draftBadge : styles.badge}>{unsaved ? "Unsaved changes" : changed ? "Draft changes" : "Published"}</span><span>Last published {record.published_at ? new Date(record.published_at).toISOString().replace("T", " · ").slice(0, 18) + " UTC" : "—"}</span></div>
    </header>
    <div className={styles.sectionNavigation} aria-label="Content area">{(Object.keys(websiteEditorGroups) as Array<keyof typeof websiteEditorGroups>).map(area => <Button key={area} aria-pressed={scope === area} onClick={() => { if (unsaved || pending) { setNotice("Save or discard your edits before switching content areas."); return; } setScope(area); setActive(null); setNotice(""); }}>{({homepage:"Homepage",destinations:"Destinations",pages:"Public pages",global:"Global navigation, footer & SEO"})[area]}</Button>)}</div>
    {notice && <p className={styles.notice} role="alert">{notice}</p>}
    <div className={styles.columns}>
      <div className={styles.cards}>
        <div className={styles.listHeading}><h2>Website sections</h2><span>{websiteSections.length} sections · {scope === "homepage" ? "Public page order" : "Shared visitor content"}</span></div>
        {websiteSections.map((section, index) => {
          const draft = section.fields.some(f => content[f.key] !== record.published_body?.content[f.key]);
          const thumbnail = section.fields.find(f => f.kind === "image");
          const title = section.fields.find(f => f.key.endsWith(".title"));
          return <details className={styles.card} key={section.id} id={`cms-${section.id}`} data-section={section.id} open={active === section.id}>
            <summary onClick={event => { event.preventDefault(); select(section.id); }}>
              <span className={styles.cardTop}><strong><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>{section.title}</strong><span className={draft || states[section.id]?.dirty ? styles.draftBadge : styles.badge}>{states[section.id]?.dirty ? "Unsaved" : draft ? "Draft changes" : "Published"}</span></span>
              <span className={styles.cardOverview}>
                {thumbnail && <Image unoptimized width={160} height={90} className={styles.cardThumbnail} src={content[thumbnail.key]} alt={`Current ${section.title}`} />}
                <span className={styles.cardCopy}><span>{section.id === "heroAmenities" ? "Service highlights inside the hero image" : title ? content[title.key] : section.id === "tourPage" ? content["tourPage.eyebrow"] : section.id === "navigation" ? "Header links and booking buttons" : "Contact details, footer links and site information"}</span><small>{section.id === "hero" ? "Desktop image ✓ · Mobile image ✓" : `${section.fields.length} content fields`}</small></span>
                <span className={styles.editLabel}>{active === section.id ? "Close −" : "Edit"}</span>
              </span>
            </summary>
            <WebsiteSectionEditor key={record.updated_at} operatorId={operatorId} sectionId={section.id} content={content} stamp={record.updated_at} onStateChange={onStateChange} />
          </details>;
        })}
      </div>
      <aside className={styles.sidebar} aria-label="Website tools">
        <div className={styles.sideCard}><p className={styles.breadcrumb}>Saved content</p><h2>{selected.title}</h2>
          {image && <Image unoptimized width={480} height={270} className={styles.contextImage} src={content[image.key]} alt={`Saved ${selected.title}`} />}
          <p className={styles.helper}>Preview opens the selected presentation with saved draft content. Save your changes before previewing.</p><a className={`${styles.secondary} ss-button`} href={preview} target="_blank" rel="noopener noreferrer"><ButtonContent>Open draft preview</ButtonContent></a>
        </div>
        <div className={styles.sideCard}><h2>Page status</h2><dl><div><dt>Content</dt><dd>{changed ? "Saved draft changes" : "Published"}</dd></div><div><dt>SEO</dt><dd>{content["seo.title"] && content["seo.description"] && content["seo.image"] && content["seo.alt"] ? "Required fields filled" : "Needs attention"}</dd></div></dl><p className={styles.helper}>Publish applies the open section and all saved drafts. Prices and departures stay in their operational editors. Routes and GPS stay in the live map app.</p></div>
        <nav className={styles.sideCard} aria-label="Website sections"><h2>Jump to section</h2>{websiteSections.map(s => <button type="button" key={s.id} aria-current={active === s.id ? "true" : undefined} onClick={() => select(s.id, true)}>{s.title}</button>)}</nav>
      </aside>
    </div>
  </section>;
}
