'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {withOperatorService} from '@/modules/identity/operator-service';
export async function saveProductBooking(operatorId:string,productId:string,form:FormData) {
 try {
  await withOperatorService(operatorId,'catalog.manage',async(client,ctx)=>{
   const {error}=await client.rpc('save_product_booking_v1',{p_operator:ctx.operatorId,p_actor:ctx.staffProfileId,p_product:productId,p_source:form.get('inventory_product_id')||null,p_mode:form.get('seat_reservation_mode'),p_minutes:Number(form.get('reservation_minutes')),p_stamp:form.get('updated_at')});
   if(error)throw Error(['PT409','PT422','22023'].includes(error.code)?error.message:'Unable to save reservation settings.');
  });
  revalidatePath('/','layout');

 }catch(error){return {error:error instanceof Error?error.message:'Unable to save reservation settings.'};}
 redirect(`/admin/${operatorId}/departures?view=calendar&result=saved`);
}
