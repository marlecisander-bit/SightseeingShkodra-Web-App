'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {withOperatorService} from '@/modules/identity/operator-service';
export async function saveProductWorkspace(operatorId:string,productId:string|null,form:FormData){
 const operation=String(form.get('operation')??'draft');let saved=productId;
 try{
  const patch:Record<string,unknown>={};
  for(const k of ['title','inclusions','supplier_id'])if(form.has(k))patch[k]=form.get(k);
  if(form.has('image'))patch.card={feature_icons:JSON.parse(String(form.get('feature_icons')??'{}')),features:form.getAll('features'),image:form.get('image'),alt:form.get('alt'),description:form.get('description'),enabled:form.get('enabled')==='on',order:Number(form.get('order'))};
  await withOperatorService(operatorId,operation==='create'?'catalog.manage':operation==='draft'?'content.draft':'content.publish',async(client,ctx)=>{
   const {data,error}=await client.rpc('save_product_workspace_v1',{p_operator:ctx.operatorId,p_actor:ctx.staffProfileId,p_product:productId,p_stamp:form.get('updated_at')||null,p_operation:operation,p_patch:patch});
   if(error)throw Error(['PT409','PT422','22023'].includes(error.code)?error.message:'Product could not be saved. Check your access and try again.');saved=data;
  });revalidatePath('/','layout');
 }catch(error){return {error:error instanceof Error?error.message:'Product could not be saved.'};}
 const tab=form.get('tab')==='website'?'website':'details';
 redirect(`/admin/${operatorId}/products?product=${saved}&tab=${tab}&result=${operation}`);
}
