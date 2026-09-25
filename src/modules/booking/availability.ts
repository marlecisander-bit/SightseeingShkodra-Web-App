import { passengerCount, type PassengerCategories, type PassengerSnapshot } from "./passengers";
import type { AvailabilityRequest, AvailabilityQuote } from './contracts';
export type { AvailabilityRequest, AvailabilityQuote } from './contracts';
export type AvailabilitySnapshot = {
  operator_id: string; product_id: string; service_date: string; as_of: string;
  pricing_rules: unknown;
  business_date?: string; next_operational_date?: string|null;
  categories?: PassengerCategories;
  departures: { id: string; start_time: string; capacity: number; passenger_quote?: PassengerSnapshot; committed: number; held: number }[];
};
export class AvailabilityError extends Error {
  constructor(public readonly code: 'INVALID_REQUEST' | 'NOT_FOUND' | 'INVALID_CONFIGURATION' | 'UNAVAILABLE') { super(code); }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateAvailabilityRequest(value: AvailabilityRequest) {
  if(value?.passengers){try{if(passengerCount(value.passengers)!==value.guests)throw Error();}catch{throw new AvailabilityError("INVALID_REQUEST");}}
  if (!value || value.version !== 1 || typeof value.operatorId !== 'string' || !uuid.test(value.operatorId)
    || typeof value.productId !== 'string' || !uuid.test(value.productId)
    || typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)
    || !Number.isFinite(Date.parse(value.date)) || new Date(value.date).toISOString().slice(0, 10) !== value.date
    || !Number.isSafeInteger(value.guests) || value.guests < 1 || value.guests > 2147483647) {
    throw new AvailabilityError('INVALID_REQUEST');
  }
}
export function quoteAvailability(request: AvailabilityRequest, snapshot: AvailabilitySnapshot | null): AvailabilityQuote {
  validateAvailabilityRequest(request);
  if (!snapshot) throw new AvailabilityError('NOT_FOUND');
  if (snapshot.operator_id !== request.operatorId || snapshot.product_id !== request.productId || snapshot.service_date !== request.date) throw new AvailabilityError('UNAVAILABLE');
  const price = snapshot.pricing_rules as { version?: unknown; model?: unknown; currency?: unknown; unit_price?: unknown } | null;
  if (!price || Object.keys(price).sort().join(',') !== 'currency,model,unit_price,version'
    || price.version !== 1 || price.model !== 'per_guest' || price.currency !== 'EUR'
    || typeof price.unit_price !== 'number' || !Number.isSafeInteger(price.unit_price) || price.unit_price < 0
    || !Number.isSafeInteger(price.unit_price * request.guests)) throw new AvailabilityError('INVALID_CONFIGURATION');
  return { version: 1, productId: request.productId, date: request.date, guests: request.guests,
    businessDate:snapshot.business_date,nextOperationalDate:snapshot.next_operational_date,categories:snapshot.categories, asOf: snapshot.as_of, currency: 'EUR', unitPrice: price.unit_price, total: price.unit_price * request.guests,
    departures: snapshot.departures.map((departure) => {
      if (![departure.capacity, departure.committed, departure.held].every((n) => Number.isSafeInteger(n) && n >= 0)) throw new AvailabilityError('INVALID_CONFIGURATION');
      const remaining = Math.max(0, departure.capacity - departure.committed - departure.held);
      return { passengerQuote:departure.passenger_quote, id: departure.id, startTime: departure.start_time, remaining, available: remaining >= (request.passengers ? request.passengers.adult + request.passengers.child : request.guests) };
    }) };
}
