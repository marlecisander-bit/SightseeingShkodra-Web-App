"use client";
import {sectionConsumers} from "@/modules/content/editorial-fields";

import { ownerFieldLabel } from "./presentation";
import { Button, ButtonContent } from "@/components/ui/button";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { SectionCardHeader } from "./website-section-card";
import type { WebsiteRecord } from "@/modules/content/website-server";
import { websiteFields, visibilityScope, websiteEditorGroups, homepageVisible } from "@/modules/content/website-schema";
import { WebsiteSectionEditor } from "./website-editor";
import styles from "./website-editor.module.css";
import { usePanelHistory } from './use-panel-history';


export function WebsiteWorkspace({ operatorId, record, destinationManager, footerGoogleEditor, canPublish = false, canSensitive = false, destinationLinks = [] }: { operatorId: string; record: WebsiteRecord; destinationManager: ReactNode; footerGoogleEditor?:ReactNode; canPublish?:boolean; canSensitive?:boolean; destinationLinks?:{value:string;label:string}[] }) {
  const [values, setValues] = useState(record.body.content);
  const [savedStamp, setSavedStamp] = useState(record.updated_at);
  const [scope, setScope] = useState<keyof typeof websiteEditorGroups>("homepage");
  const websiteSections = websiteEditorGroups[scope].filter(s=>canSensitive || !["footer","whatsapp","legalprivacy","legalterms"].includes(s.id));
  const [active, setActive] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, { dirty: boolean; pending: boolean }>>({});
  const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const onFeedback = useCallback((id: string, message: string) => setFeedback(current => ({...current, [id]: message})), []);
  const onStateChange = useCallback((id: string, dirty: boolean, pending: boolean) => setStates(current => current[id]?.dirty === dirty && current[id]?.pending === pending ? current : { ...current, [id]: { dirty, pending } }), []);
  if (savedStamp !== record.updated_at) { setSavedStamp(record.updated_at); setValues(record.body.content); setStates({}); }
  const content = record.body.content;
  const changed = Object.keys(content).some(key => content[key] !== record.published_body?.content[key]);
  const dirtySection = websiteSections.find(s => s.fields.some(f => values[f.key] !== content[f.key]));
  const unsaved = !!dirtySection;
  const pending = Object.values(states).some(s => s.pending);
  const panelHistory = usePanelHistory('website-section', value => { setActive(value); setNotice(''); }, () => {
    if (unsaved || pending) { setNotice('Save or discard your changes before returning to sections.'); return false; }
    return true;
  });
  const selected = websiteSections.find(s => s.id === active) ?? websiteSections[0];
  const image = selected.fields.find(f => f.kind === "image");
  const preview = `/admin/${operatorId}/website-preview?page=${({routePage:"route",homeRoute:"home",bookSeo:"book",faqSeo:"faq",exploreSeo:"explore",legalprivacy:"privacy-policy",legalterms:"terms-and-conditions",faq:"faq",tourPage:"tour",explorePage:"explore",bookPage:"book",dayPage:"your-day"} as Record<string,string>)[selected.id]??"home"}`;
  function select(id: string, jump = false) {
    if (pending || (dirtySection && dirtySection.id !== id)) { setNotice("Save or discard your current edits before opening another section."); return; }
    setNotice("");
    if(active === id && !jump) panelHistory.close();
    else { panelHistory.open(id); setActive(id); }
    if(window.matchMedia("(max-width: 767px)").matches) requestAnimationFrame(()=>document.getElementById(`cms-${id}`)?.scrollIntoView({block:"start"}));
    if (jump) requestAnimationFrame(() => { const el = document.getElementById(`cms-${id}`); el?.scrollIntoView({ block: "start", behavior: "smooth" }); el?.querySelector("summary")?.focus(); });
  }
  if(scope==="destinations") return <section className={styles.cms} data-editing={!!active}><Button onClick={()=>setScope("homepage")}>Back to website content</Button>{destinationManager}</section>;
  return <section className={styles.cms} data-editing={!!active}>
    {active&&<Button className={styles.backToSections} type="button" disabled={pending} onClick={()=>panelHistory.close()}>Back to website sections</Button>}
    {active&&<a className={styles.focusedPreview} href={preview} target="_blank" rel="noopener noreferrer">Preview saved draft</a>}
    <header className={styles.toolbar}>
      <div><p className={styles.breadcrumb}>Website / {({homepage:"Homepage",destinations:"Destinations",pages:"Public pages",global:"Global"})[scope]}</p><h1>{({homepage:"Homepage content",destinations:"Destination content",pages:"Public page content",global:"Global website content"})[scope]}</h1><p className={styles.subtitle}>Choose what visitors see, then preview and publish when you’re ready.</p></div>
      <div className={styles.toolbarActions}>
        <a className={`${styles.textButton} ss-button`} href="/" target="_blank" rel="noopener noreferrer"><ButtonContent>View Website</ButtonContent></a>
        <a className={`${styles.secondary} ss-button`} href={preview} target="_blank" rel="noopener noreferrer"><ButtonContent>Preview saved draft</ButtonContent></a>
        {unsaved && <Button className={styles.secondary} form={`cms-form-${dirtySection?.id ?? active ?? websiteSections[0].id}`} name="operation" value="draft" disabled={pending}>Save Draft</Button>}
        <Button className={styles.primary} form={`cms-form-${dirtySection?.id ?? active ?? websiteSections[0].id}`} name="operation" value="publish" disabled={pending || !canPublish}>{pending ? "Saving…" : "Publish"}</Button>
      </div>
      <div className={styles.toolbarStatus} role="status"><span className={changed || unsaved ? styles.draftBadge : styles.badge}>{unsaved ? "Unsaved changes" : changed ? "Draft changes" : "Published"}</span><span>Last published {record.published_at ? new Date(record.published_at).toISOString().replace("T", " · ").slice(0, 18) + " UTC" : "—"}</span></div>
    </header>
    <div className={styles.sectionNavigation} aria-label="Content area">{(Object.keys(websiteEditorGroups) as Array<keyof typeof websiteEditorGroups>).map(area => <Button key={area} aria-pressed={scope === area} onClick={() => { if (unsaved || pending) { setNotice("Save or discard your edits before switching content areas."); return; } setScope(area); setActive(null); setNotice(""); }}>{({homepage:"Homepage",destinations:"Destinations",pages:"Public pages",global:"Global: contact, navigation & footer"})[area]}</Button>)}</div>
    {notice && <p className={styles.notice} role="alert">{notice}</p>}
    <details><summary>Review all pending Website changes</summary><p>Publish includes the selected form and every saved Website draft listed here. Unsaved changes in other forms are not included.</p><ul>{Object.keys(content).filter(key=>values[key]!==record.published_body?.content[key]).map(key=><li key={key} style={{overflowWrap:"anywhere"}}><strong>{websiteFields.find(f=>f.key===key)?.label??"Retained content"}</strong><div>Published: {record.published_body?.content[key] ?? "Not published"}</div><div>Next publication: {values[key]}</div></li>)}</ul></details>
    <div className={styles.columns}>
      <div className={styles.cards}>
        <div className={styles.listHeading}><h2>{scope === "homepage" ? "Homepage sections" : "Website sections"}</h2><span>{websiteSections.length} sections · {scope === "homepage" ? "Homepage order" : "Website content"}</span></div>
        {websiteSections.map((section, index) => {
          const draft = section.fields.some(f => content[f.key] !== record.published_body?.content[f.key]);
          return <details className={styles.card} key={section.id} id={`cms-${section.id}`} data-section={section.id} data-hidden={section.fields.some(f => f.kind === "visibility") && !homepageVisible(values, section.id)} open={active === section.id}>
            <summary onClick={event => { event.preventDefault(); select(section.id); }}>
              <SectionCardHeader id={section.id} title={ownerFieldLabel(section.title)} index={index} open={active === section.id} onEdit={() => select(section.id)} draft={states[section.id]?.dirty ? "Unsaved" : draft ? "Draft changes" : undefined} visibility={
              section.fields.some(f => f.kind === "visibility") && <span className={styles.visibilityRow} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>

                <label><input type="checkbox" role="switch" aria-label={`Show ${section.title} ${visibilityScope(section.id)}`} checked={homepageVisible(values, section.id)} disabled={pending || (!!dirtySection && dirtySection.id !== section.id)} onChange={event => { setActive(null); setValues(current => ({...current, [`${section.id}.showOnHomepage`]: String(event.target.checked)})); }} /><span className={styles.visibilityCopy}><strong>{homepageVisible(values, section.id) ? "Visible" : "Hidden"}</strong><span>{visibilityScope(section.id)}</span></span></label>
                {dirtySection?.id === section.id && active !== section.id && <span className={styles.visibilityActions}><Button form={`cms-form-${section.id}`} name="operation" value="draft" disabled={pending}>Save Draft</Button><Button type="button" disabled={pending} onClick={() => setValues(current => ({...current, ...Object.fromEntries(section.fields.map(f => [f.key, content[f.key]]))}))}>Discard</Button></span>}
              </span>} />
              {dirtySection?.id === section.id && section.fields.some(f => f.kind === "visibility" && values[f.key] !== content[f.key]) && <small className={styles.helper}>Unsaved visibility. Last saved: {homepageVisible(content, section.id) ? "Visible" : "Hidden"}. Save Draft keeps changes private until you publish.</small>}
              {section.id === "heroAmenities" && <small className={styles.helper}>Retained content; amenities are not rendered on the homepage.</small>}
              {active !== section.id && feedback[section.id] && <span className={styles.notice} role="status">{feedback[section.id]}</span>}
            </summary>
            {(active===section.id || dirtySection?.id===section.id || (!active&&index===0))&&<WebsiteSectionEditor canPublish={canPublish} destinationLinks={destinationLinks} onFeedback={onFeedback} values={values} setValues={setValues} operatorId={operatorId} sectionId={section.id} content={content} stamp={record.updated_at} onStateChange={onStateChange} />}
            {active===section.id&&section.id==="footer"&&footerGoogleEditor}
          </details>;
        })}
      </div>
      <aside className={styles.sidebar} aria-label="Website tools">
        <div className={styles.sideCard}><p className={styles.breadcrumb}>Draft preview</p><h2>{ownerFieldLabel(selected.title)}</h2>
          {image && content[image.key] && <Image unoptimized loading="lazy" width={480} height={270} className={styles.contextImage} src={content[image.key]} alt={`Saved ${selected.title}`} />}
          <p>{sectionConsumers[selected.id]}</p><p className={styles.helper}>Save your draft first to see your latest changes in the preview.</p><a className={`${styles.secondary} ss-button`} href={preview} target="_blank" rel="noopener noreferrer"><ButtonContent>Preview saved draft</ButtonContent></a>
        </div>
        <div className={`${styles.sideCard} ${styles.tipsCard}`}><h2>Quick tips</h2><ul><li>Keep text short and clear.</li><li>Choose sharp, high-quality images.</li><li>Show only the sections you need.</li><li>Preview before publishing.</li></ul></div>
        <div className={styles.sideCard}><h2>Page status</h2><dl><div><dt>Content</dt><dd>{changed ? "Saved draft changes" : "Published"}</dd></div><div><dt>Unsaved changes</dt><dd>{unsaved ? "Yes" : "No"}</dd></div></dl><p className={styles.helper}>Publishing makes this section and all saved drafts visible on the website, according to their visibility settings.</p></div>
        <nav className={styles.sideCard} aria-label="Website sections"><h2>Quick navigation</h2>{websiteSections.map(s => <button type="button" key={s.id} aria-current={active === s.id ? "true" : undefined} onClick={() => select(s.id, true)}>{ownerFieldLabel(s.title)}</button>)}</nav>
      </aside>
    </div>
  </section>;
}
