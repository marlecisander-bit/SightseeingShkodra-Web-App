import {withOperatorService} from "@/modules/identity/operator-service";
import {meetingPoint} from "@/modules/booking/meeting-point";
import {getDestinationStops} from "@/modules/content/destination-stops-server";
import {MutationForm} from "./mutation-form";
import {SubmitButton} from "./submit-button";
import {saveMeetingPoint} from "./meeting-point-actions";
export async function MeetingPointPanel({operatorId}:{operatorId:string}) {
 const rows=await withOperatorService(operatorId,"operator.manage",async(client)=>{
  const {data,error}=await client.from("meeting_point_versions").select("id,effective_at,details").eq("operator_id",operatorId).order("effective_at",{ascending:false});
  if(error)throw Error("Meeting-point migration is required");return data;
 });
 const {stops}=await getDestinationStops(operatorId);
 const value=rows[0]?.details??meetingPoint;
 return <details><summary>Owner: booking meeting point</summary><p>A new version applies only to bookings confirmed after its effective UTC time. Existing bookings, including later modifications, retain their original meeting point. No messages are sent by this setting.</p><ul>{rows.map(r=><li key={r.id}>{r.effective_at}: {r.details.name}</li>)}</ul><MutationForm action={saveMeetingPoint.bind(null,operatorId)}><input type="hidden" name="stamp" value={rows[0]?.id??""}/><label>Name<input name="name" required maxLength={200} defaultValue={value.name}/></label><label>Visitor directions<textarea name="directions" maxLength={2000} defaultValue={value.directions}/></label><label>Google Maps URL<input name="url" type="url" required maxLength={2000} defaultValue={value.url}/></label><label>Associated published boarding stop<select name="stopId" defaultValue={value.stopId??""}><option value="">No association</option>{stops.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}</select></label><label>Effective time (UTC)<input name="effective" type="datetime-local" required/></label><SubmitButton>Schedule meeting point</SubmitButton></MutationForm></details>;
}
