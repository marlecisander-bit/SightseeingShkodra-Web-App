'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { withOperatorService } from '../../modules/identity/operator-service';
export async function saveContent(operatorId:string,form:FormData) {
  let result='saved';
  try {
    await withOperatorService(operatorId,'content.manage',async(client,context)=>{
      const data:Record<string,string>={};
      for(const key of ['title','slug','status','text','meta_title','meta_description','og_image','og_image_alt']) {
        const value=form.get(key);if(typeof value==='string')data[key]=value;
      }
      const id=form.get('id'), updated=form.get('updated_at');
      const {error}=await client.rpc('save_content_page_v1',{p_operator_id:context.operatorId,p_actor_id:context.staffProfileId,
        p_id:typeof id==='string'&&id?id:null,p_data:data,p_expected_updated_at:typeof updated==='string'&&updated?updated:null});
      if(error)result=error.code==='PT409'?'stale':'error';
    });
  } catch {result='error';}
  if(result!=='saved')return {error:result==='stale'?'This page changed on the server. Your draft is preserved here; copy it before reloading the latest version.':'Unable to save. Check the unique slug, body and SEO fields, and image alt text. Your entries are preserved.'};
  const path=`/admin/${encodeURIComponent(operatorId)}/content`;
  revalidatePath(path);redirect(`${path}?result=${result}`);
}
