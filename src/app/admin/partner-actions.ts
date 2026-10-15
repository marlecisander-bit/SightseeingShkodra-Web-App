'use server';
import {revalidatePath} from 'next/cache';
import {withOperatorService} from '@/modules/identity/operator-service';
import {parsePartner} from '@/modules/content/partners';
import {ownerActionError} from './action-error';
export async function savePartner(operatorId:string,form:FormData) {
 try {
 const id=String(form.get('id')??''),operation=String(form.get('operation')??'save');
 if(!['save','delete'].includes(operation)||id&&!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))throw Error('Invalid partner action.');
 if(operation==='delete'&&(!id||form.get('confirm_delete')!=='yes'))throw Error('Confirm deletion before removing this partner.');
 await withOperatorService(operatorId,'content.publish',async(client,context)=>{
 const stamp=String(form.get('updated_at')??'');
 if(operation==='delete') {
 const r=await client.from('partners').delete().eq('operator_id',context.operatorId).eq('id',id).eq('updated_at',stamp).select('id');
 if(r.error)throw Error('Partner could not be deleted.');if(!r.data?.length)throw Error('This partner changed. Reload before deleting.');
 }else {
 const values=parsePartner(form,context.operatorId);
 if(id) {
 const r=await client.from('partners').update({...values,updated_at:new Date().toISOString()}).eq('operator_id',context.operatorId).eq('id',id).eq('updated_at',stamp).select('id');
 if(r.error)throw Error('Partner could not be saved.');if(!r.data?.length)throw Error('This partner changed. Reload before saving.');
 }else {const r=await client.from('partners').insert({...values,operator_id:context.operatorId});if(r.error)throw Error('Partner could not be created.');}
 }
 });
 revalidatePath('/','layout');revalidatePath(`/admin/${operatorId}/partners`);
 return {saved:operation==='delete'?'Partner deleted.':'Partner saved.'};
 }catch(e){return {error:ownerActionError(e,'Partner could not be saved. Check your access and try again.')};}
}
