import {mapStopSummary} from './map-stop-summary';
import "server-only";
import { createClient } from "@supabase/supabase-js";
export type DestinationStop = { id: string; label: string };
/** Read-only references to the independent map. Never import operational records. */
export async function getDestinationStops(operatorId: string): Promise<{stops:DestinationStop[];available:boolean}> {
  if(operatorId!==process.env.PUBLIC_OPERATOR_ID || !process.env.LIVE_MAP_SUPABASE_URL || !process.env.LIVE_MAP_PUBLISHABLE_KEY)return {stops:[],available:false};
  try {
    const client=createClient(process.env.LIVE_MAP_SUPABASE_URL,process.env.LIVE_MAP_PUBLISHABLE_KEY,{auth:{persistSession:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store",signal:AbortSignal.timeout(4000)})}});
    const {data:project,error:pError}=await client.from("projects").select("id").eq("slug",process.env.LIVE_MAP_PROJECT_SLUG??"sightseeing-shkodra").eq("is_public",true).single();
    if(pError)throw Error("Unavailable");
    const {data,error}=await client.from("map_versions").select("map_data").eq("project_id",project.id).eq("status","published").order("published_at",{ascending:false,nullsFirst:false}).limit(1).maybeSingle();
    if(error||!Array.isArray(data?.map_data?.features))throw Error("Unavailable");
    const stops=mapStopSummary(data.map_data.features);
    return {stops,available:true};
  }catch{return {stops:[],available:false};}
}
