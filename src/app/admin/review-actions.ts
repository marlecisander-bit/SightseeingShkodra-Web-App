'use server';
import { revalidatePath } from 'next/cache';
import { withOperatorService } from '@/modules/identity/operator-service';
import { parseReview, reviewUrl } from '@/modules/content/reviews';
export async function saveReview(operatorId:string,form:FormData) {
 try {
 const id=String(form.get('id')??''),operation=String(form.get('operation')??'save');
 if(!['save','delete'].includes(operation))throw Error('Unknown action.');
 if(id&&!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid review.');
 const values=operation==='delete'?{deleted_at:new Date().toISOString(),published:false}:parseReview(form);
 await withOperatorService(operatorId,'content.manage',async(client,context)=>{
 if(operation==='delete'&&!id)throw Error('Choose a saved review.');
 if(id){const result=await client.from('reviews').update(values).eq('operator_id',context.operatorId).eq('id',id).eq('updated_at',String(form.get('updated_at'))).is('deleted_at',null).select('id');if(result.error)throw Error('Review could not be saved.');if(!result.data?.length)throw Error('This review changed. Reload before saving.');}
 else{const result=await client.from('reviews').insert({...values,operator_id:context.operatorId});if(result.error)throw Error('Review could not be created.');}
 });
 revalidatePath('/');revalidatePath(`/admin/${operatorId}/reviews`);
 return {saved:operation==='delete'?'Review deleted.':'Review saved.'};
 }catch(e){return {error:e instanceof Error?e.message:'Review could not be saved.'};}
}
export async function saveReviewSettings(operatorId:string,form:FormData) {
 try {const display_limit=Number(form.get('display_limit'));if(![3,4,5,6].includes(display_limit))throw Error('Choose 3 to 6 reviews.');
 const values={display_limit,google_reviews_url:reviewUrl(String(form.get('google_reviews_url')??''),true),leave_review_url:reviewUrl(String(form.get('leave_review_url')??''),true)};
 await withOperatorService(operatorId,'content.manage',async(client,context)=>{const r=await client.from('review_settings').upsert({...values,operator_id:context.operatorId,updated_at:new Date().toISOString()});if(r.error)throw Error('Settings could not be saved.');});
 revalidatePath('/');revalidatePath(`/admin/${operatorId}/reviews`);return {saved:'Review settings saved.'};
 }catch(e){return {error:e instanceof Error?e.message:'Settings could not be saved.'};}
}
