import {PartnerSummary,PartnerWebsite} from './website-engagement';
import Link from 'next/link';
import {getEditorPartners} from '@/modules/content/partners-server';
import {hasPermission} from '@/modules/identity/roles';
import {PartnerEditor} from './partners-editor';
import {CatalogCreate} from './catalog-create';
import styles from './catalog.module.css';
export async function PartnersPanel({operatorId}:{operatorId:string}) {
 let data;
 try {data=await getEditorPartners(operatorId);}catch{return <p role="alert">Partner management is unavailable. Please try again or ask your administrator to check the Partners migration.</p>;}
 const canEdit=hasPermission(data.role,'content.publish');
 return <><p>Manage approved homepage partners. Active partners with logos appear in display order. <Link prefetch={false} href={`/admin/${operatorId}/content#admin-nav=partners`}>Edit section text, visibility and optional button in Website → Homepage → Our Partners</Link>.</p>
 <div className={styles.group}>{canEdit&&<CatalogCreate label="Add partner"><PartnerEditor operatorId={operatorId}/></CatalogCreate>}
 {!data.partners.length&&<p>No partners entered. The homepage section remains hidden until an active partner has a logo.</p>}
 {data.partners.map(p=><details className={styles.record} key={p.id}><summary><PartnerSummary partner={p}/></summary><div className={styles.recordBody}><PartnerWebsite partner={p}/>{canEdit?<PartnerEditor key={p.updated_at} operatorId={operatorId} partner={p}/>:<p>{p.description||'Only owners and administrators can change published partners.'}</p>}</div></details>)}</div></>;
}
