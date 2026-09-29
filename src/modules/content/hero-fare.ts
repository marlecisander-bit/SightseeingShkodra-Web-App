import type { AvailabilityQuote, AvailabilityRequest } from "../booking/contracts";

export type HeroFare = { amount: number; currency: string; date: string };

/** Select existing one-adult quotes; never recalculate seasonal prices here. */
export function adultHeroFare(quote: AvailabilityQuote): HeroFare | undefined {
  if (quote.guests !== 1) return;
  const amounts = quote.departures.filter(d => d.available).flatMap(d => {
    const q = d.passengerQuote;
    const line = q?.lines.find(l => l.category === "adult" && l.quantity === 1);
    return q?.counts.adult === 1 && q.counts.child === 0 && q.counts.infant === 0 &&
      q.currency === quote.currency && line && Number.isSafeInteger(line.total) && line.total > 0
      ? [line.total] : [];
  });
  if (amounts.length) return { amount: Math.min(...amounts), currency: quote.currency, date: quote.date };
}

/** Bounded fail-closed lookup using the booking engine's operational dates.
 * A sold-out date is skipped; no calendar or price rules are copied here.
 */
export async function nextHeroFare(initial: AvailabilityQuote, request: AvailabilityRequest,
  sources: { quote: (request: AvailabilityRequest) => Promise<AvailabilityQuote>; nextDate: (after: string) => Promise<string | null> },
): Promise<HeroFare | undefined> {
  let quote = initial;
  for (let attempt = 0; attempt < 14; attempt++) {
    if (quote.productId !== request.productId || quote.date !== request.date || quote.guests !== 1) return;
    const fare = adultHeroFare(quote);
    if (fare) return fare;
    // A free or invalid fare must not silently move the advertised date later.
    if (quote.departures.some(d => d.available)) return;
    const date = quote.nextOperationalDate ?? await sources.nextDate(quote.date);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date <= quote.date) return;
    request = { ...request, date, passengers: { adult: 1, child: 0, infant: 0 } };
    quote = await sources.quote(request);
  }
}
