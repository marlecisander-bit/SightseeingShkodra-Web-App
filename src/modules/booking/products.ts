/** Public offer metadata only. Prices and inventory come from the booking engine. */
export type BookableProduct = {
  id: string; title: string; slug: string; primary?:boolean;
  mode: 'selected_departure' | 'whole_day'; minutes: number;
  card?: {description: string; image: string; alt: string; enabled: boolean; order: number};
};
export function reservationLabel(product: Pick<BookableProduct,'mode'|'minutes'>) {
  return product.mode === 'whole_day' ? 'Seat reserved all operating day' : `Seat reserved for your selected departure · ${product.minutes%60===0?`${product.minutes/60} ${product.minutes===60?"hour":"hours"}`:`${product.minutes} minutes`}`;
}
export function validProductId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export type SeatReservation = {mode:'selected_departure'|'whole_day';minutes:number;start:string;end:string};
