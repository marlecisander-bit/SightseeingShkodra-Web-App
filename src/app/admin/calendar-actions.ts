"use server";
import { ownerActionError } from "./action-error";
import { revalidatePath } from "next/cache";
import { withOperatorService } from "@/modules/identity/operator-service";
import type { PassengerCategories } from "@/modules/booking/passengers";
export async function saveCalendar(operatorId:string,scheduleId:string,stamp:string,input:{from:string;to:string;weekdays:number[];settings:unknown;confirmed:boolean;restore?:boolean}) {
  try {await withOperatorService(operatorId,"schedule.manage",async(client,ctx)=>{
    const {error}=await client.rpc("save_calendar_override_v1",{p_operator:ctx.operatorId,p_actor:ctx.staffProfileId,p_schedule:scheduleId,p_stamp:stamp,p_from:input.from,p_to:input.to,p_weekdays:input.weekdays,p_value:input.settings,p_confirm_closure:input.confirmed,p_restore:input.restore??false});
    if(error)throw Error(["PT409","PT422","PT428","22023"].includes(error.code)?error.message:"Unable to save calendar changes.");
  });revalidatePath(`/admin/${operatorId}/departures`);return {saved:true};}catch(e){return {error:ownerActionError(e,"The calendar could not be saved. Check dates, times and maximum seats, then try again.")};}
}
export async function savePassengerPricing(operatorId:string,productId:string,stamp:string,config:PassengerCategories) {
  try {await withOperatorService(operatorId,"departures.manage",async(client,ctx)=>{
    const {error}=await client.rpc("save_passenger_pricing_v1",{p_operator:ctx.operatorId,p_actor:ctx.staffProfileId,p_product:productId,p_stamp:stamp,p_config:config});
    if(error)throw Error(["PT409","22023"].includes(error.code)?error.message:"Unable to save pricing.");
  });revalidatePath("/","layout");return {saved:true};}catch(e){return {error:ownerActionError(e,"Prices could not be saved. Check each age group and price, then try again.")};}
}
