"use client";
import { useEffect, useState } from "react";
import type { AvailabilityQuote } from "@/modules/booking/contracts";

export function useAvailability(date: string, guests: number) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    quote?: AvailabilityQuote;
    timezone?: string;
    error?: string;
  }>();
  const key = `${date}/${guests}/${revision}`;
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/public/availability?${new URLSearchParams({ date, guests: String(guests) })}`,
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
              data.error === "NOT_PUBLISHED"
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
          setResult({ key, quote: data.quote, timezone: data.timezone });
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
  }, [date, guests, key]);
  useEffect(() => {
    if (!date) return;
    const refresh = () => setRevision((value) => value + 1);
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [date]);
  const current = result?.key === key ? result : undefined;
  return {
    quote: date ? current?.quote : undefined,
    timezone: current?.timezone,
    error: current?.error,
    loading: Boolean(date && !current),
    refresh: () => setRevision((value) => value + 1),
  };
}

export function displayMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(
    value / 100,
  );
}
