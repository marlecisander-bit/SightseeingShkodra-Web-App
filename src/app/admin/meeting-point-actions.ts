"use server";
import { revalidatePath } from "next/cache";
import { withOperatorService } from "@/modules/identity/operator-service";
import { validateMeetingPoint } from "@/modules/booking/meeting-point";
import { getDestinationStops } from "@/modules/content/destination-stops-server";
export async function saveMeetingPoint(operatorId:string, form:FormData) {
  try {
    const value=validateMeetingPoint({name:String(form.get("name")??""),directions:String(form.get("directions")??""),url:String(form.get("url")??""),stopId:String(form.get("stopId")??"")||null,label:"Open meeting point in Google Maps"});
    await withOperatorService(operatorId,"operator.manage",async(client,ctx)=>{
      if(value.stopId && !(await getDestinationStops(operatorId)).stops.some(s=>s.id===value.stopId)) throw Error("Choose a published stop.");
      const {error}=await client.rpc("save_meeting_point_v1",{p_operator:operatorId,p_actor:ctx.staffProfileId,p_value:value,p_effective:String(form.get("effective"))+"Z",p_expected:String(form.get("stamp")??"")||null});
      if(error) throw Error("Meeting point could not be saved. Refresh and check the effective time.");
    });
    revalidatePath(`/admin/${operatorId}/departures`);
    return;
  } catch {return {error:"Unable to save. Owner access, valid details and a future UTC effective time are required. Refresh before retrying."};}
}
