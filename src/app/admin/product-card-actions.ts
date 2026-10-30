'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {safeWebsiteImage} from '@/modules/content/website-schema';
import {withOperatorService} from '@/modules/identity/operator-service';
export async function saveProductCard(operatorId:string,productId:string,form:FormData) {
 const publish=form.get('operation')==='publish';
 try {
  const image=form.get("image");if(typeof image!=="string"||(image&&(!safeWebsiteImage(image)||(!image.startsWith("/images/")&&!new URL(image).pathname.includes(`/website-media/${operatorId}/`)))))return {error:"Choose an uploaded photo belonging to this operator."};
  await withOperatorService(operatorId,publish?'content.publish':'content.draft',async(client,ctx)=>{
   const {error}=await client.rpc('save_product_card_v1',{p_operator:ctx.operatorId,p_actor:ctx.staffProfileId,p_product:productId,p_stamp:form.get('updated_at'),p_publish:publish,p_card:{description:form.get('description'),image:form.get('image'),alt:form.get('alt'),enabled:form.get('enabled')==='on',order:Number(form.get('order'))}});
   if(error)throw Error(['PT409','22023'].includes(error.code)?error.message:'Unable to save product card.');
  });revalidatePath('/','layout');
 }catch(error){return {error:error instanceof Error?error.message:'Unable to save product card.'};}
 redirect(`/admin/${operatorId}/product-cards?result=saved`);
}
