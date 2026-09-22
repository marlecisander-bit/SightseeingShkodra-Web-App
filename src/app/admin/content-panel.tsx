import { createSessionClient } from '../../modules/identity/supabase-server';
import { requirePermission } from '../../modules/identity/require-permission';
import { saveContent } from './content-actions';
type Page={id?:string;title?:string;slug?:string;status?:string;body?:{version?:number;format?:string;text?:string};meta_title?:string|null;meta_description?:string|null;og_image?:string|null;og_image_alt?:string|null;updated_at?:string};
function Editor({operatorId,page}:{operatorId:string;page:Page}) {
  if(page.body?.format && page.body.format!=='plain_text')return <p>This content format cannot be edited with the plain-text editor.</p>;
  return <form action={saveContent.bind(null,operatorId)}>
    <input type="hidden" name="id" value={page.id??''}/><input type="hidden" name="updated_at" value={page.updated_at??''}/>
    <label>Page title<input name="title" required maxLength={200} defaultValue={page.title}/></label>
    <label>URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} defaultValue={page.slug}/></label>
    <label>Content (plain text)<textarea name="text" rows={12} maxLength={50000} defaultValue={page.body?.text??''}/></label>
    <label>SEO title<input name="meta_title" maxLength={200} defaultValue={page.meta_title??''}/></label>
    <label>SEO description<textarea name="meta_description" rows={3} maxLength={500} defaultValue={page.meta_description??''}/></label>
    <label>Social image HTTPS URL<input type="url" name="og_image" maxLength={2000} defaultValue={page.og_image??''}/></label>
    <label>Image description<input name="og_image_alt" maxLength={500} defaultValue={page.og_image_alt??''}/></label>
    <label>Publication status<select name="status" defaultValue={page.status??'draft'}>{['draft','published','archived'].map(s=><option key={s}>{s}</option>)}</select></label>
    <button>{page.id?'Save page':'Create page'}</button>
    {page.body?.text&&<details><summary>Saved text preview</summary><div style={{whiteSpace:'pre-wrap'}}>{page.body.text}</div></details>}
  </form>;
}
export async function ContentPanel({operatorId,result}:{operatorId:string;result?:string}) {
  await requirePermission(operatorId,'content.manage');
  const client=await createSessionClient();
  const {data,error}=await client.from('content_pages').select('id,title,slug,status,body,meta_title,meta_description,og_image,og_image_alt,updated_at').eq('operator_id',operatorId).order('title').limit(100);
  if(error)return <p role="alert">Content is temporarily unavailable.</p>;
  return <div>{result&&<p role="status">{result==='saved'?'Page saved.':result==='stale'?'This page changed. Review the current version before saving.':'Unable to save. Check the unique slug, publication fields and image description.'}</p>}
    <p>Publishing requires body text, SEO title and description. Images require descriptive alt text. HTML is treated as text.</p>
    <details><summary>Create content page</summary><Editor operatorId={operatorId} page={{}}/></details>
    {data.length===0&&<p>No content pages yet.</p>}
    {data.map(page=><details key={page.id}><summary>{page.title} · {page.status}</summary><Editor operatorId={operatorId} page={page}/></details>)}
    <p>Showing up to 100 pages. Archive a page to withdraw it without deleting its history.</p></div>;
}
