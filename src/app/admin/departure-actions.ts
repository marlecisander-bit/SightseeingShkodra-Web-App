'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { withOperatorService } from '../../modules/identity/operator-service';
export async function saveDeparture(operatorId:string,form:FormData) {
  let result='saved';
  try {
    await withOperatorService(operatorId,'departures.manage',async(client,context)=>{
      const value=(key:string)=>{const v=form.get(key);return typeof v==='string'?v:null;};
      const quantity=value('capacity');
      if(!quantity || !/^\d+$/.test(quantity) || !Number.isSafeInteger(Number(quantity))) throw Error('Invalid capacity');
      const {error}=await client.rpc('save_departure_v1',{p_operator_id:context.operatorId,p_actor_id:context.staffProfileId,
        p_id:value('id')||null,p_product_id:value('product_id'),p_vehicle_id:value('vehicle_id')||null,
        p_date:value('service_date'),p_time:value('start_time'),p_capacity:Number(quantity),p_status:value('status'),p_expected_updated_at:value('updated_at')||null});
      if(error) { result=error.code==='PT409'?'stale':error.code==='P0001'?'inventory':'error'; }
    });
  } catch {result='error';}
  if(result!=='saved')return {error:result==='stale'?'This departure changed. Your entries are preserved; copy them before reloading the current record.':result==='inventory'?'Reserved inventory or booking history prevents this edit. Resolve affected bookings first. Your entries are preserved.':'Unable to save. Check the date, time, whole-number capacity and linked records. Your entries are preserved.'};
  const path=`/admin/${encodeURIComponent(operatorId)}/departures`;
  revalidatePath(path);
  redirect(`${path}?result=${result}`);
}
