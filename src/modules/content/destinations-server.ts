import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withOperatorService } from "../identity/operator-service";
import { destinationPlace, type DestinationRecord } from "./destinations";
export const getPublicDestinations = cache(async () => {
  await connection();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,operator=process.env.PUBLIC_OPERATOR_ID;
  if(!url||!key||!operator)return [];
  const client=createClient(url,key,{auth:{persistSession:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store",signal:AbortSignal.timeout(5000)})}});
  const {data,error}=await client.from("content_pages").select("id,published_body,destination_aliases").eq("operator_id",operator).eq("is_destination",true).eq("status","published").order("destination_order").order("id").limit(500);
  if(error)throw Error("Destinations are temporarily unavailable.");
  return (data as DestinationRecord[]).filter(r=>r.published_body).map(r=>destinationPlace(r));
});
export async function getDestinationEditor(operatorId:string) {
  return withOperatorService(operatorId,"content.manage",async(client)=>{
    const {data,error}=await client.from("content_pages").select("id,body,published_body,status,destination_order,destination_aliases,updated_at").eq("operator_id",operatorId).eq("is_destination",true).order("destination_order").order("id").limit(500);
    if(error)throw Error("Destinations unavailable");return data as DestinationRecord[];
  });
}
