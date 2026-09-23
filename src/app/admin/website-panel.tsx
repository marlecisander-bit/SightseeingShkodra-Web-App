import { getWebsiteEditor } from "@/modules/content/website-server";
import { websiteSections } from "@/modules/content/website-schema";
import { WebsiteSectionEditor } from "./website-editor";
import styles from "./website-editor.module.css";
import Image from "next/image";
export async function WebsitePanel({ operatorId }: { operatorId: string }) {
  let record;
  try { record = await getWebsiteEditor(operatorId); }
  catch { return <p role="alert">Homepage content is unavailable. Check the database connection and homepage initialization.</p>; }
  const content = record.body.content;
  const changed = JSON.stringify(content) !== JSON.stringify(record.published_body?.content);
  return <section>
    <h2>Website · Homepage</h2>
    <p>Manage the existing homepage. Edit and save one section at a time. Prices and departures are managed in Products and Departures; routes and GPS stay in the live map app.</p>
    <div className={styles.actions}><a href="/" target="_blank" rel="noopener noreferrer">View Live Page</a><a href={`/admin/${operatorId}/website-preview`} target="_blank" rel="noopener noreferrer">Preview saved draft</a></div>
    <p role="status">{changed ? "Draft changes" : "Published"} · Last published: {record.published_at ? new Date(record.published_at).toISOString() : "Not yet"}</p>
    <div className={styles.cards}>{websiteSections.map(section => {
      const sectionChanged = section.fields.some(field => content[field.key] !== record.published_body?.content[field.key]);
      const image = section.fields.find(field => field.kind === "image");
      const title = section.fields.find(field => field.key.endsWith(".title"));
      return <details className={styles.card} key={`${section.id}-${record.updated_at}`} data-section={section.id}>
        <summary><strong>{section.title}</strong> · {sectionChanged ? "Draft changes" : "Published"} · Edit
          {image && <Image unoptimized width={384} height={144} className={styles.thumbnail} src={content[image.key]} alt={`Current ${section.title}`} />}
          {title && <span className={styles.status}>Current title: {content[title.key]}</span>}
        </summary>
        <WebsiteSectionEditor operatorId={operatorId} sectionId={section.id} content={content} stamp={record.updated_at} />
      </details>;
    })}</div>
  </section>;
}
