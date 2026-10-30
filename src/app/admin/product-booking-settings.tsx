import {MutationForm} from './mutation-form';
import {SubmitButton} from './submit-button';
import {saveProductBooking} from './product-booking-actions';
export type BookingProductSettings={id:string;title:string;updated_at:string;inventory_product_id:string|null;seat_reservation_mode:string;reservation_minutes:number};
export function ProductBookingSettings({operatorId,product,sources,workspace=false}:{workspace?:boolean;operatorId:string;product:BookingProductSettings;sources:{id:string;title:string}[]}) {
 return <details><summary>{product.title} · Seat reservations</summary><MutationForm action={saveProductBooking.bind(null,operatorId,product.id)}>
 {workspace&&<input type="hidden" name="workspace_product" value={product.id}/>}<input type="hidden" name="updated_at" value={product.updated_at}/>
 <label>Van schedule &amp; capacity<select name="inventory_product_id" defaultValue={product.inventory_product_id??''}><option value="">Own van schedule</option>{sources.filter(p=>p.id!==product.id).map(p=><option value={p.id} key={p.id}>Share {p.title}</option>)}</select></label>
 <p>Choose the same schedule for products using the same van.</p>
 <label>Seat reservation<select name="seat_reservation_mode" defaultValue={product.seat_reservation_mode}><option value="selected_departure">Trip duration</option><option value="whole_day">Whole operating day</option></select></label>
 <label>Trip duration (minutes)<input name="reservation_minutes" type="number" min="1" max="1440" required defaultValue={product.reservation_minutes}/></label>
 <p>Selected departures reserve seats for the trip duration. Whole-day tickets reserve seats throughout that service date. Adults and children occupy seats; infants do not. Changes apply to new reservations only.</p>
 <SubmitButton>Save reservation settings</SubmitButton>
 </MutationForm></details>;
}
