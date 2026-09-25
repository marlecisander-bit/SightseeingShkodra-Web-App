import 'server-only';
import { withOperatorService } from '../identity/operator-service';

/** Staff date browsing uses the same date materializer as public availability. */
export async function prepareServiceDate(operatorId: string, date?: string) {
  return withOperatorService(operatorId, 'departures.manage', async client => {
    const {data: operator,error: operatorError} = await client.from('operators').select('timezone').eq('id',operatorId).single();
    if(operatorError) throw Error('Operator unavailable');
    const day = date ?? new Intl.DateTimeFormat('en-CA',{timeZone:operator.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const {data,error} = await client.from('service_schedules').select('product_id').eq('operator_id',operatorId);
    if(error) throw Error('Schedules unavailable');
    for(const schedule of data) {
      const {error} = await client.rpc('ensure_schedule_date_v1',{p_operator_id:operatorId,p_product_id:schedule.product_id,p_date:day});
      if(error) throw Error('Schedule date unavailable');
    }
    return day;
  });
}
