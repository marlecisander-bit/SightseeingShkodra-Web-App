"use client";
import { useState } from "react";
import { ageLabel,passengerKeys,passengerLabels,passengerCount,type PassengerCategories } from "@/modules/booking/passengers";
export function StaffPassengers({departures}:{departures:{id:string;productId?:string;label:string;categories:PassengerCategories}[]}) {
 const [id,setId]=useState(""),[counts,setCounts]=useState({adult:1,child:0,infant:0});
 const selected=departures.find(d=>(d.productId?`${d.productId}/${d.id}`:d.id)===id);let error="";try{passengerCount(counts);}catch(e){error=e instanceof Error?e.message:"Invalid passengers";}
 return <><label>Departure<select name="booking_choice" required value={id} onChange={e=>setId(e.target.value)}><option value="">Choose departure</option>{departures.map(d=><option key={d.productId?`${d.productId}/${d.id}`:d.id} value={d.productId?`${d.productId}/${d.id}`:d.id}>{d.label}</option>)}</select></label><input type="hidden" name="departure_id" value={selected?.id??""}/><input type="hidden" name="product_id" value={selected?.productId??""}/><fieldset><legend>Passengers</legend>{passengerKeys.map(k=><label key={k}>{passengerLabels[k]} {selected&&ageLabel(selected.categories[k])}<input type="number" name={k} min="0" max="100" required value={counts[k]} onChange={e=>setCounts({...counts,[k]:Number(e.target.value)})}/></label>)}{error&&<p role="alert">{error}</p>}</fieldset></>;
}
