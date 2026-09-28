"use client";
import { Button, ButtonContent } from "@/components/ui/button";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import type { WebsiteRecord } from "@/modules/content/website-server";
import { websiteEditorGroups, homepageVisible } from "@/modules/content/website-schema";
import { WebsiteSectionEditor } from "./website-editor";
import styles from "./website-editor.module.css";

const sectionDescriptions: Record<string,string> = {hero:"Your first impression: headline, photograph and booking invitation",heroAmenities:"Saved service highlights",intro:"Introduce the experience and help guests plan their day",route:"Introduce the destinations along the way",live:"Help guests find the van during their visit",departures:"Introduce today’s timetable",reviews:"Guest stories and your review section heading",notebook:"Stories, tips and inspiration",final:"A final invitation to book their day",navigation:"Links visitors use to explore your website",footer:"Contact information and useful links",seo:"How your homepage appears in search and social sharing"};

export function WebsiteWorkspace({ operatorId, record, destinationManager }: { operatorId: string; record: WebsiteRecord; destinationManager: ReactNode }) {
  const [values, setValues] = useState(record.body.content);
  const [savedStamp, setSavedStamp] = useState(record.updated_at);
  const [scope, setScope] = useState<keyof typeof websiteEditorGroups>("homepage");
  const websiteSections = websiteEditorGroups[scope];
  const [active, setActive] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, { dirty: boolean; pending: boolean }>>({});
  const [notice, setNotice] = useState("");
  const onStateChange = useCallback((id: string, dirty: boolean, pending: boolean) => setStates(current => current[id]?.dirty === dirty && current[id]?.pending === pending ? current : { ...current, [id]: { dirty, pending } }), []);
  if (savedStamp !== record.updated_at) { setSavedStamp(record.updated_at); setValues(record.body.content); setStates({}); }
  const content = record.body.content;
  const changed = websiteSections.some(s => s.fields.some(f => content[f.key] !== record.published_body?.content[f.key]));
  const dirtySection = websiteSections.find(s => s.fields.some(f => values[f.key] !== content[f.key]));
  const unsaved = !!dirtySection;
  const pending = Object.values(states).some(s => s.pending);
  const selected = websiteSections.find(s => s.id === active) ?? websiteSections[0];
  const image = selected.fields.find(f => f.kind === "image");
  const preview = `/admin/${operatorId}/website-preview?page=${({how:"tour",tourPage:"tour",explorePage:"explore",bookPage:"book",dayPage:"your-day"} as Record<string,string>)[selected.id]??"home"}`;
  function select(id: string, jump = false) {
    if (pending || (dirtySection && dirtySection.id !== id)) { setNotice("Save or discard your current edits before opening another section."); return; }
    setNotice(""); setActive(active === id && !jump ? null : id);
    if (jump) requestAnimationFrame(() => { const el = document.getElementById(`cms-${id}`); el?.scrollIntoView({ block: "start", behavior: "smooth" }); el?.querySelector("summary")?.focus(); });
  }
  if(scope==="destinations") return <section className={styles.cms}><Button onClick={()=>setScope("homepage")}>Back to website content</Button>{destinationManager}</section>;
  return <section className={styles.cms}>
    <header className={styles.toolbar}>
      <div><p className={styles.breadcrumb}>Website / {({homepage:"Homepage",destinations:"Destinations",pages:"Public pages",global:"Global"})[scope]}</p><h1>{({homepage:"Homepage content",destinations:"Destination content",pages:"Public page content",global:"Global website content"})[scope]}</h1><p className={styles.subtitle}>Choose what visitors see, then preview and publish when you’re ready.</p></div>
      <div className={styles.toolbarActions}>
        <a className={`${styles.textButton} ss-button`} href="/" target="_blank" rel="noopener noreferrer"><ButtonContent>View Website</ButtonContent></a>
        <a className={`${styles.secondary} ss-button`} href={preview} target="_blank" rel="noopener noreferrer"><ButtonContent>Preview website</ButtonContent></a>
        {unsaved && <Button className={styles.secondary} form={`cms-form-${dirtySection?.id ?? active ?? websiteSections[0].id}`} name="operation" value="draft" disabled={pending}>Save Draft</Button>}
        <Button className={styles.primary} form={`cms-form-${dirtySection?.id ?? active ?? websiteSections[0].id}`} name="operation" value="publish" disabled={pending}>{pending ? "Saving…" : "Publish"}</Button>
      </div>
      <div className={styles.toolbarStatus} role="status"><span className={changed || unsaved ? styles.draftBadge : styles.badge}>{unsaved ? "Unsaved changes" : changed ? "Draft changes" : "Published"}</span><span>Last published {record.published_at ? new Date(record.published_at).toISOString().replace("T", " · ").slice(0, 18) + " UTC" : "—"}</span></div>
    </header>
    <div className={styles.sectionNavigation} aria-label="Content area">{(Object.keys(websiteEditorGroups) as Array<keyof typeof websiteEditorGroups>).map(area => <Button key={area} aria-pressed={scope === area} onClick={() => { if (unsaved || pending) { setNotice("Save or discard your edits before switching content areas."); return; } setScope(area); setActive(null); setNotice(""); }}>{({homepage:"Homepage",destinations:"Destinations",pages:"Public pages",global:"Navigation, footer & search"})[area]}</Button>)}</div>
    {notice && <p className={styles.notice} role="alert">{notice}</p>}
    <div className={styles.columns}>
      <div className={styles.cards}>
        <div className={styles.listHeading}><h2>Website sections</h2><span>{websiteSections.length} sections · {scope === "homepage" ? "Homepage order" : "Website content"}</span></div>
        {websiteSections.map((section, index) => {
          const draft = section.fields.some(f => content[f.key] !== record.published_body?.content[f.key]);
          const thumbnail = section.fields.find(f => f.kind === "image");
          const title = section.fields.find(f => f.key.endsWith(".title"));
          return <details className={styles.card} key={section.id} id={`cms-${section.id}`} data-section={section.id} open={active === section.id}>
            <summary onClick={event => { event.preventDefault(); select(section.id); }}>
              <span className={styles.cardTop}><strong><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>{section.title}</strong><span className={draft || states[section.id]?.dirty ? styles.draftBadge : styles.badge}>{states[section.id]?.dirty ? "Unsaved" : draft ? "Draft changes" : "Published"}</span></span>
              <span className={styles.cardOverview}>
                {thumbnail && <Image unoptimized width={160} height={90} className={styles.cardThumbnail} src={content[thumbnail.key]} alt={`Current ${section.title}`} />}
                <span className={styles.cardCopy}><span>{sectionDescriptions[section.id] ?? (title ? content[title.key] : section.title)}</span></span>
                <span className={styles.editLabel}>{active === section.id ? "Close −" : "Edit"}</span>
              </span>
              {section.fields.some(f => f.kind === "visibility") && <span className={styles.visibilityRow} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
                <span className={homepageVisible(values, section.id) ? styles.badge : styles.hiddenBadge}>{homepageVisible(values, section.id) ? "Visible" : "Hidden"}</span>
                <label><input type="checkbox" role="switch" aria-label={`Show ${section.title} on homepage`} checked={homepageVisible(values, section.id)} disabled={pending || (!!dirtySection && dirtySection.id !== section.id)} onChange={event => { setActive(null); setValues(current => ({...current, [`${section.id}.showOnHomepage`]: String(event.target.checked)})); }} />Show on homepage <strong>{homepageVisible(values, section.id) ? "ON" : "OFF"}</strong></label>
                {dirtySection?.id === section.id && <span className={styles.visibilityActions}><Button form={`cms-form-${section.id}`} name="operation" value="draft" disabled={pending}>Save Draft</Button><Button type="button" disabled={pending} onClick={() => setValues(current => ({...current, ...Object.fromEntries(section.fields.map(f => [f.key, content[f.key]]))}))}>Discard</Button></span>}
              </span>}
              {section.id === "heroAmenities" && <small className={styles.helper}>Retained content; amenities are not rendered on the homepage.</small>}
            </summary>
            <WebsiteSectionEditor values={values} setValues={setValues} key={record.updated_at} operatorId={operatorId} sectionId={section.id} content={content} stamp={record.updated_at} onStateChange={onStateChange} />
          </details>;
        })}
      </div>
      <aside className={styles.sidebar} aria-label="Website tools">
        <div className={styles.sideCard}><p className={styles.breadcrumb}>Website preview</p><h2>{selected.title}</h2>
          {image && <Image unoptimized width={480} height={270} className={styles.contextImage} src={content[image.key]} alt={`Saved ${selected.title}`} />}
          <p className={styles.helper}>Save your draft first to see your latest changes in the preview.</p><a className={`${styles.secondary} ss-button`} href={preview} target="_blank" rel="noopener noreferrer"><ButtonContent>Preview saved draft</ButtonContent></a>
        </div>
        <div className={styles.sideCard}><h2>Page status</h2><dl><div><dt>Content</dt><dd>{changed ? "Saved draft changes" : "Published"}</dd></div><div><dt>Unsaved changes</dt><dd>{unsaved ? "Yes" : "No"}</dd></div></dl><p className={styles.helper}>Publishing makes this section and all saved drafts visible on the website, according to their visibility settings.</p></div>
        <nav className={styles.sideCard} aria-label="Website sections"><h2>Quick navigation</h2>{websiteSections.map(s => <button type="button" key={s.id} aria-current={active === s.id ? "true" : undefined} onClick={() => select(s.id, true)}>{s.title}</button>)}</nav>
      </aside>
    </div>
  </section>;
}
