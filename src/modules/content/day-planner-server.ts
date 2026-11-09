import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getHomepage } from '@/modules/content/homepage-server';
import { getDestinationStops } from '@/modules/content/destination-stops-server';
import { plannerClock, type DayPlannerData } from '@/modules/content/day-planner';
export async function getDayPlanner() {
 const date=plannerClock().date,operator=process.env.PUBLIC_OPERATOR_ID;
 const [home,route]=await Promise.all([getHomepage(),getDestinationStops(operator??'')]);
 const result:DayPlannerData={date,title:home.product?.title??'View tickets',times:null,fares:home.date===date?home.adultFares??[]:[],stops:route.available?route.stops:null};
 try {
  if(!operator||!home.product)throw Error();
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(5000)})}});
  // Ticket sales may be paused while the shared route service still operates.
  // The effective inventory schedule alone determines timetable times.
  if(home.product.active===false)result.fares=[];
  const inventory=await client.rpc('inventory_product_v1',{p_product:home.product.id});
  if(inventory.error||!inventory.data)throw Error('Product schedule unavailable');
  const {data,error}=await client.from('service_schedules').select('id').eq('operator_id',operator).eq('product_id',inventory.data);
  if(error)throw error;
  const slots=await Promise.all((data??[]).map(async s=>{const r=await client.rpc('effective_schedule_times_v1',{p_schedule_id:s.id,p_date:date});if(r.error)throw r.error;return r.data as {start_time:string}[];}));
  result.times=[...new Set(slots.flat().map(s=>s.start_time.slice(0,5)))].sort();
 }catch{result.times=null;/* Independent failure: published route and fare remain useful. */}
 return result;
}
