import {AdminStatus} from './admin-status';
import {getEditorPartners} from '@/modules/content/partners-server';
import {hasPermission} from '@/modules/identity/roles';
import {PartnerEditor} from './partners-editor';
import {CatalogCreate} from './catalog-create';
import styles from './catalog.module.css';
export async function PartnersPanel({operatorId}:{operatorId:string}) {
 let data;
 try {data=await getEditorPartners(operatorId);}catch{return <p role="alert">Partner management is unavailable. Please try again or ask your administrator to check the Partners migration.</p>;}
 const canEdit=hasPermission(data.role,'content.publish');
 return <><p>Manage approved homepage partners. Active partners with logos appear in display order. <a href={`/admin/${operatorId}/content`}>Edit section text, visibility and optional button in Website → Homepage → Our Partners</a>.</p>
 <div className={styles.group}>{canEdit&&<CatalogCreate label="Add partner"><PartnerEditor operatorId={operatorId}/></CatalogCreate>}
 {!data.partners.length&&<p>No partners entered. The homepage section remains hidden until an active partner has a logo.</p>}
 {data.partners.map(p=><details className={styles.record} key={p.id}><summary>{p.name}<span className={styles.metadata}><AdminStatus status={p.is_active?'active':'inactive'}>{p.is_active?'Active':'Inactive'}</AdminStatus> · Order {p.display_order}</span></summary><div className={styles.recordBody}>{canEdit?<PartnerEditor key={p.updated_at} operatorId={operatorId} partner={p}/>:<p>{p.description||'Only owners and administrators can change published partners.'}</p>}</div></details>)}</div></>;
}
