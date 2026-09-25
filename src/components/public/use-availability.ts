"use client";
import { passengerCount, type PassengerCategories, type PassengerCounts } from "@/modules/booking/passengers";

import { useEffect, useState } from "react";
import type { AvailabilityQuote } from "@/modules/booking/contracts";

export function useAvailability(date: string, guests: number, passengers?:PassengerCounts, generation = 0) {
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
  const key = `${date}/${counts}/${revision}/${generation}`;
  useEffect(() => {
    if (!date || validation) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/public/availability?${new URLSearchParams({ date, guests: String(guests),...Object.fromEntries(Object.entries(JSON.parse(counts)).map(([k,v])=>[k,String(v)])) })}`,
          {
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(12000),
            ]),
          },
        );
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setResult({
            key,
            error:
              data.error === "PRICING_UNAVAILABLE"?"Prices for the selected passenger categories have not been configured yet. Please contact the operator.":data.error === "NOT_PUBLISHED"
                ? "The tour is not published yet."
                : data.error === "INVALID_REQUEST"
                  ? "Choose a valid date and guest count."
                  : "Availability is temporarily unavailable. Please retry.",
          });
        } else if (
          data.quote?.date === date &&
          data.quote?.guests === guests &&
          data.quote?.version === 1 &&
          Array.isArray(data.quote.departures)
        ) {
          setCategories(data.quote.categories);setResult({ key, quote: data.quote, timezone: data.timezone });
        } else throw new Error("Invalid response");
      } catch {
        if (!controller.signal.aborted)
          setResult({
            key,
            error: "Availability is temporarily unavailable. Please retry.",
          });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [date, guests, key,counts,validation]);
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
    quote: date && !validation ? current?.quote : undefined,
    timezone: current?.timezone,
    error: validation||current?.error,
    loading: Boolean(date && !validation && !current),
    refresh: () => setRevision((value) => value + 1),
  };
}

export function displayMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(
    value / 100,
  );
}
