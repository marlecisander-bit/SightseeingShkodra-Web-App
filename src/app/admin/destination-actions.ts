"use server";
import { revalidatePath } from "next/cache";
import { withOperatorService } from "@/modules/identity/operator-service";
import { validateDestination, type Destination } from "@/modules/content/destinations";
import { getDestinationStops } from "@/modules/content/destination-stops-server";
export async function saveDestination(operatorId:string,id:string|null,stamp:string|null,data:Destination,operation:string,order:number) {
  try {
    if(["draft","publish"].includes(operation))validateDestination(data,operation==="publish");
    const saved=await withOperatorService(operatorId,"content.manage",async(client,context)=>{
      if(data.stopId && ["draft","publish"].includes(operation)) {
        const existing=id?await client.from("content_pages").select("body").eq("operator_id",operatorId).eq("id",id).single():null;
        if(existing?.data?.body?.stopId!==data.stopId) {const source=await getDestinationStops(operatorId);if(!source.stops.some(s=>s.id===data.stopId))throw Error("Choose an available published route stop, or no associated stop.");}
      }
      const result=await client.rpc("save_destination_v1",{p_operator_id:context.operatorId,p_actor_id:context.staffProfileId,p_id:id,p_stamp:stamp,p_data:data,p_operation:operation,p_order:order});
      if(result.error)throw Error(result.error.code==="PT409"?"This destination changed. Reload before saving; preserve your edits first.":"Unable to save. Check required fields and whether the slug is already used.");return result.data as string;
    });
    revalidatePath("/","layout");return {saved};
  }catch(error){return {error:error instanceof Error?error.message:"Destination unavailable"};}
}
