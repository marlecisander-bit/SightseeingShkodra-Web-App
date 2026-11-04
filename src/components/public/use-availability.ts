"use client";
import { passengerCount, type PassengerCategories, type PassengerCounts } from "@/modules/booking/passengers";

import { useEffect, useState, useRef } from "react";
import type { AvailabilityQuote } from "@/modules/booking/contracts";

type AvailabilityData={quote:AvailabilityQuote;timezone?:string};
const unavailable="Availability is temporarily unavailable. Please retry.";
class AvailabilityReadError extends Error {}
/** One public request/validation path for selection and mobile calendar checks. */
async function readAvailability(date:string,guests:number,counts:string,productId:string|undefined,signal:AbortSignal):Promise<AvailabilityData>{
 try{
  const response=await fetch(`/api/public/availability?${new URLSearchParams({...(productId?{productId}:{}),date,guests:String(guests),...Object.fromEntries(Object.entries(JSON.parse(counts)).map(([k,v])=>[k,String(v)]))})}`,{cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});
  const data=await response.json();
  if(!response.ok)throw new AvailabilityReadError(data.error==='PRICING_UNAVAILABLE'?"Prices for the selected passenger categories have not been configured yet. Please contact the operator.":data.error==='NOT_PUBLISHED'?"The tour is not published yet.":data.error==='INVALID_REQUEST'?"Choose a valid date and guest count.":unavailable);
  if(data.quote?.date!==date||data.quote?.guests!==guests||data.quote?.version!==1||(productId&&data.quote.productId!==productId)||!Array.isArray(data.quote.departures))throw new AvailabilityReadError(unavailable);
  return data;
 }catch(error){if(error instanceof AvailabilityReadError)throw error;throw new AvailabilityReadError(unavailable);}
}

export function useAvailability(date: string, guests: number, passengers?:PassengerCounts, generation = 0, productId?:string) {
  const checkedDate = useRef<{date:string;counts:string;productId?:string;generation:number;revision:number;checkedAt:number;data:{quote:AvailabilityQuote;timezone?:string}}|null>(null);
  const [categories,setCategories]=useState<PassengerCategories>();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    quote?: AvailabilityQuote;
    timezone?: string;
    error?: string;
  }>();
  const counts=JSON.stringify(passengers??{adult:guests,child:0,infant:0});
  let validation="";try{passengerCount(JSON.parse(counts));}catch(e){validation=e instanceof Error?e.message:"Invalid passengers";}
  const key = `${productId??"default"}/${date}/${counts}/${revision}/${generation}`;
  useEffect(() => {
    if (!date || validation) return;
    const seed=checkedDate.current;
    if(seed&&seed.date===date&&seed.counts===counts&&seed.productId===productId&&seed.generation===generation&&seed.revision===revision&&Date.now()-seed.checkedAt<5000){
      let live=true;queueMicrotask(()=>{if(live){if(checkedDate.current===seed)checkedDate.current=null;setCategories(seed.data.quote.categories);setResult({key,...seed.data});}});return()=>{live=false;};
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data=await readAvailability(date,guests,counts,productId,controller.signal);
        if(controller.signal.aborted)return;
        setCategories(data.quote.categories);setResult({key,...data});
      } catch(error) {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:error instanceof AvailabilityReadError?error.message:unavailable,
          });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [date, guests, key,counts,validation,productId,generation,revision]);
  useEffect(() => {
    if (!date) return;
    const refresh = () => setRevision((value) => value + 1);
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [date,validation]);
  const current = result?.key === key ? result : undefined;
  return {
    categories,
    // Calendar selection validates one requested date through the same public API.
    // Its exact quote seeds the next selection, avoiding a duplicate request.
    checkDate: async (nextDate:string,signal:AbortSignal) => {
      if(validation)throw new Error(validation);
      const data=await readAvailability(nextDate,guests,counts,productId,signal);
      if(signal.aborted)throw new DOMException('Aborted','AbortError');
      if(nextDate===date){checkedDate.current=null;setCategories(data.quote.categories);setResult({key,...data});}
      else checkedDate.current={date:nextDate,counts,productId,generation,revision,checkedAt:Date.now(),data};
      return data.quote as AvailabilityQuote;
    },
    quote: date && !validation ? current?.quote : undefined,
    timezone: current?.timezone,
    error: validation||current?.error,
    loading: Boolean(date && !validation && !current),
    refresh: () => setRevision((value) => value + 1),
  };
}

export { bookingMoney as displayMoney } from "./booking-presentation";
