import "server-only";
import {cache} from "react";
import {connection} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {meetingPoint,validateMeetingPoint,type MeetingPoint} from "./meeting-point";
// Read only. This is presentation for new bookings, never a historical booking lookup.
export const getCurrentMeetingPoint=cache(async():Promise<MeetingPoint|null>=>{
 await connection();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,operator=process.env.PUBLIC_OPERATOR_ID;
 if(!url||!key||!operator)return null;
 try {
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store",signal:AbortSignal.timeout(10000)})}});
  const {data,error}=await client.from("meeting_point_versions").select("details").eq("operator_id",operator).lte("effective_at",new Date().toISOString()).order("effective_at",{ascending:false}).limit(1).maybeSingle();
  if(error)return null;
  return data?validateMeetingPoint(data.details):meetingPoint;
 }catch{return null;}
});
