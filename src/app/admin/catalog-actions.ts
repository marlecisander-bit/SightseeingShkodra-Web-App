'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { withOperatorService } from '../../modules/identity/operator-service';
export async function saveCatalog(operatorId: string, entity: string, form: FormData) {
  let failed = false;
  try {
    await withOperatorService(operatorId,'catalog.manage',async(client,context)=>{
      const data: Record<string,string>={};
      for(const key of ['title','name','slug','type','status','supplier_id','meta_title','meta_description','og_image','og_image_alt','product_id','lat','lng','sort_order']) {
        const value=form.get(key); if(typeof value==='string') data[key]=value;
      }
      const id=form.get('id');
      const remove=form.get('operation')==='remove';
      if(remove && form.get('confirm_remove')!=='yes') throw Error('Confirmation required');
      const { error }=await client.rpc('save_catalog_v1',{p_operator_id:context.operatorId,p_actor_id:context.staffProfileId,
        p_entity:entity,p_id:typeof id==='string' && id ? id:null,p_data:data,p_delete:remove});
      if(error) throw Error('Catalog save failed');
    });
  } catch { failed=true; }
  const path=`/admin/${encodeURIComponent(operatorId)}/catalog`;
  revalidatePath(path);
  redirect(`${path}?result=${failed?'error':'saved'}`);
}
