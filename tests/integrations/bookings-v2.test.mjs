import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {hasPermission} from '../../src/modules/identity/roles.ts';
registerHooks({resolve(s,c,next){if(s==='./operations-calendar')return {url:'data:text/javascript,'+encodeURIComponent('export function OperationsCalendar(){};export function StandardPricing(){}'),shortCircuit:true};if(s==='./departures-panel')return {url:'data:text/javascript,export function InventoryHistoryPanel(){}',shortCircuit:true};const names={'./bookings-workspace':'BookingsWorkspace','./booking-record':'BookingRecord','./booking-confirmation':'BookingConfirmation','./staff-passengers':'StaffPassengers','./mutation-form':'MutationForm','./submit-button':'SubmitButton'};if(names[s])return {url:'data:text/javascript,'+encodeURIComponent(`export function ${names[s]}(){}`),shortCircuit:true};if(s.endsWith('identity/supabase-server'))return {url:'data:text/javascript,'+encodeURIComponent('export const createSessionClient=async()=>globalThis.bookingFixture.client;'),shortCircuit:true};if(s.endsWith('identity/require-permission'))return {url:'data:text/javascript,'+encodeURIComponent('export const requirePermission=(op,p)=>globalThis.bookingFixture.authorize(op,p);'),shortCircuit:true};if(s.endsWith('identity/operator-service'))return {url:'data:text/javascript,'+encodeURIComponent('export const withOperatorService=async(op,p,run)=>run(globalThis.bookingFixture.client,await globalThis.bookingFixture.authorize(op,p));'),shortCircuit:true};if(s==='next/navigation')return {url:'data:text/javascript,'+encodeURIComponent("export function redirect(url){const e=new Error('REDIRECT');e.destination=url;throw e;}"),shortCircuit:true};if(s==='next/cache')return {url:'data:text/javascript,export function revalidatePath(){}',shortCircuit:true};if(s==='next/link'||s==='next/form')return {url:'data:text/javascript,export default function Link(){}',shortCircuit:true};return next(s,c);},load(url,c,next){
 if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};
 const clientNames={'bookings-workspace.tsx':'BookingsWorkspace','booking-record.tsx':'BookingRecord','booking-confirmation.tsx':'BookingConfirmation','staff-passengers.tsx':'StaffPassengers','mutation-form.tsx':'MutationForm','submit-button.tsx':'SubmitButton'};
 for(const [file,name] of Object.entries(clientNames))if(url.endsWith('/'+file))return {format:'module',source:`export function ${name}(){}`,shortCircuit:true};
 if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};
 if(url.endsWith('/supabase-server.ts'))return {format:'module',source:'export const createSessionClient=async()=>globalThis.bookingFixture.client;',shortCircuit:true};
 if(url.endsWith('/require-permission.ts'))return {format:'module',source:'export const requirePermission=(op,permission)=>globalThis.bookingFixture.authorize(op,permission);',shortCircuit:true};
 if(url.endsWith('/operator-service.ts'))return {format:'module',source:'export const withOperatorService=async(op,p,run)=>{const c=await globalThis.bookingFixture.authorize(op,p);return run(globalThis.bookingFixture.client,c)};',shortCircuit:true};
 return next(url,c);
}});
const {BookingsPanel}=await import('../../src/app/admin/bookings-panel.tsx');
const op='10000000-0000-4000-8000-000000000001',booking='10000000-0000-4000-8000-000000000050';
function fixture({role='owner',capTable,failedTable,orderCount=1,paid=false,allowRpc=false,unprepared=false}={}){
 const calls=[],checks=[];
 const data={vehicles:[],service_schedules:[{id:'schedule-1',product_id:'product-1'}],operators:{timezone:'Europe/Tirane'},orders:[{id:'order-1',customer_id:'person-1',status:'confirmed',total:9000,currency:'EUR',collection_mode:'meeting_point'}],customers:[{id:'person-1',name:'Synthetic Guest',email:'guest@example.test',phone:'000'}],bookings:[{id:booking,order_id:'order-1',booking_reference:'SS-LOCAL',status:'confirmed',qr_token:null,checked_in_at:null}],booking_items:[{order_id:'order-1',product_id:'product-1',departure_id:'departure-1',quantity:3,occupied_seats:2,status:'confirmed',passenger_snapshot:null}],departures:[{id:'departure-1',product_id:'product-1',service_date:'2026-10-24',start_time:'11:00:00'}],products:[{id:'product-1',title:'Local tour'}],payments:paid?[{order_id:'order-1',status:'paid',amount:9000,currency:'EUR'}]:[],inventory_holds:[],notification_deliveries:[]};
 if(unprepared){data.bookings=[];data.orders[0].status='pending';data.inventory_holds=[{order_id:'order-1',status:'active',expires_at:'2026-10-24T12:00Z'}];}
 const client=createClient('https://fixture.invalid','synthetic-key',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(String(input)),table=url.pathname.split('/').at(-1);calls.push({url,method:init.method,table});
  if(url.pathname.includes('/rpc/')){if(!allowRpc)throw Error('Unexpected RPC during reading');return new Response(JSON.stringify(table==='passenger_categories_v1'?{adult:{min:13,max:null,price:6000},child:{min:3,max:12,price:3000},infant:{min:0,max:2,price:0}}:table==='read_operations_calendar_v1'?{days:[],categories:{}}:null),{status:200,headers:{'content-type':'application/json'}});}
  const count=table===capTable?1001:table==='orders'?orderCount:Array.isArray(data[table])?data[table].length:1;
  let body=data[table];if(table==='bookings'&&url.searchParams.get('select')==='order_id')body={order_id:'order-1'};
  return new Response(JSON.stringify(table===failedTable?{message:'Do not expose private service error'}:body),{status:table===failedTable?500:200,headers:{'content-type':'application/json','content-range':`0-0/${count}`}});
 }}});
 globalThis.bookingFixture={client,authorize:async(id,p)=>{checks.push(p);if(!hasPermission(role,p))throw Error('FORBIDDEN');return {operatorId:id,role,staffProfileId:'synthetic-staff'};}};
 return {calls,checks};
}
test('list reads only SELECTs and skips preparation, creation choices, categories, holds and communication reads',async()=>{
 const f=fixture(),view=await BookingsPanel({operatorId:op});
 assert.equal(view.props.entries.length,1);assert.equal(view.props.entries[0].content.props.row.items[0].seats,2);
 assert.deepEqual(f.checks,['bookings.read']);assert.ok(f.calls.every(c=>c.method==='GET'));assert.ok(f.calls.every(c=>!c.url.pathname.includes('/rpc/')));
 assert.ok(!f.calls.some(c=>['inventory_holds','notification_deliveries'].includes(c.table)));
 assert.equal(f.calls.filter(c=>c.table==='departures').length,1);
 for(const call of f.calls)assert.ok(call.url.searchParams.get(call.table==='operators'?'id':'operator_id')===`eq.${op}`);
});
test('canonical detail scopes booking ID, loads existing communications and retains authoritative stored amounts',async()=>{
 const f=fixture({paid:true}),view=await BookingsPanel({operatorId:op,booking});
 assert.equal(view.props.entries[0].content.props.selected,true);const row=view.props.entries[0].content.props.row;
 assert.equal(row.total,9000);assert.equal(row.items[0].quantity,3);assert.equal(row.payments[0].status,'paid');
 assert.ok(f.calls.some(c=>c.table==='notification_deliveries'));assert.ok(f.calls.some(c=>c.table==='inventory_holds'));
 assert.ok(f.calls.some(c=>c.table==='bookings'&&c.url.searchParams.get('id')===`eq.${booking}`));
});
test('exact email semantics remain normalized and server-filtered; date query does not materialize',async()=>{
 const f=fixture(),view=await BookingsPanel({operatorId:op,email:' GUEST@EXAMPLE.TEST ',date:'2026-10-24'});
 assert.equal(view.props.email,'guest@example.test');assert.equal(view.props.day,'2026-10-24');
 assert.ok(f.calls.some(c=>c.table==='customers'&&c.url.searchParams.get('email')==='eq.guest@example.test'));
 assert.ok(f.calls.some(c=>c.table==='departures'&&c.url.searchParams.get('service_date')==='eq.2026-10-24'));
 assert.ok(f.calls.every(c=>c.method==='GET'));
});
test('capped date prefilter or related payment/item response fails closed, never displaying partial financial details',async()=>{
 for(const capTable of ['departures','booking_items','payments']){
  fixture({capTable});const view=await BookingsPanel({operatorId:op,date:capTable==='departures'?'2026-10-24':undefined});
  assert.equal(view.props.entries,undefined);assert.match(JSON.stringify(view),/unavailable|temporarily/);
 }
});
test('list is explicitly limited without claiming an exhaustive reservation count; read errors remain generic',async()=>{
 fixture({orderCount:101});assert.equal((await BookingsPanel({operatorId:op})).props.limited,true);
 fixture({failedTable:'payments'});const view=await BookingsPanel({operatorId:op});assert.doesNotMatch(JSON.stringify(view),/private service error/);assert.match(JSON.stringify(view),/temporarily unavailable/);
});
test('content editor is denied before a client read; operations preserves permitted booking capabilities',async()=>{
 let f=fixture({role:'content_editor'});await assert.rejects(BookingsPanel({operatorId:op}),/FORBIDDEN/);assert.equal(f.calls.length,0);
 f=fixture({role:'operations'});const view=await BookingsPanel({operatorId:op});assert.equal(view.props.canCreate,true);
});
test('original mutation implementations are preserved apart from the explicit purchased-product selector',()=>{
 const source=readFileSync(new URL('../../src/app/admin/booking-actions.ts',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(source.replace('      productId: get("product_id")||undefined,\n','').split('\n/** Explicit UI preparation')[0]).digest('hex'),'1f98c92bdeb5d186dda447f341f2c885c1888837a5ff2950ac6427c659e2bc54');
 const panel=readFileSync(new URL('../../src/app/admin/bookings-panel.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(panel,/prepareServiceDate|ensure_schedule|\.insert\(|\.update\(|\.delete\(/);
 assert.match(source,/await requirePermission\(operatorId,'bookings.create'\)/);assert.match(source,/await prepareServiceDate\(operatorId,day\)/);
});

test('opening Create booking performs only category reads; preparation requires explicit authorized action',async()=>{
 const {loadBookingDepartures}=await import('../../src/app/admin/booking-actions.ts');
 let f=fixture({allowRpc:true});const view=await BookingsPanel({operatorId:op,create:'1',date:'2026-10-24'});
 assert(view.props.creation);assert(f.calls.some(c=>c.table==='passenger_categories_v1'));assert(!f.calls.some(c=>c.table==='ensure_schedule_date_v1'));
 const form=new FormData();form.set('date','2026-10-24');
 f=fixture({allowRpc:true});await assert.rejects(loadBookingDepartures(op,form),e=>e.destination?.includes('create=1&result=departures_ready'));
 assert.deepEqual(f.checks,['bookings.create','departures.manage']);assert.equal(f.calls.filter(c=>c.table==='ensure_schedule_date_v1').length,1);
 f=fixture({allowRpc:true,role:'content_editor'});assert.match((await loadBookingDepartures(op,form)).error,/could not be loaded/);assert.equal(f.calls.length,0);
 f=fixture({allowRpc:true});form.set('date','2026-02-30');assert.match((await loadBookingDepartures(op,form)).error,/could not be loaded/);assert.equal(f.calls.length,0);
});

test('orders without a prepared booking retain inline details and temporary-seat history without inventing a booking ID',async()=>{
 const f=fixture({unprepared:true});const view=await BookingsPanel({operatorId:op});const record=view.props.entries[0].content.props;
 assert.equal(record.row.bookingId,undefined);assert.equal(record.row.orderStatus,'pending');assert.equal(record.holdNotes.length,1);
 assert(f.calls.some(c=>c.table==='inventory_holds'));assert(f.calls.every(c=>c.method==='GET'));
});

test('Bookings calendar handoff omits materializing inventory subtree and preserves pure month projection',async()=>{
 const {CalendarPanel}=await import('../../src/app/admin/calendar-panel.tsx');
 const contains=(node,name)=>Array.isArray(node)?node.some(n=>contains(n,name)):!!node&&typeof node==='object'&&(node.type?.name===name||contains(node.props?.children,name));
 let f=fixture({allowRpc:true});const safe=await CalendarPanel({operatorId:op,date:'2026-10-24',fromBookings:'1'});
 assert(!contains(safe,'InventoryHistoryPanel'));assert(contains(safe,'OperationsCalendar'));assert(f.calls.some(c=>c.table==='read_operations_calendar_v1'));assert(!f.calls.some(c=>c.table==='ensure_schedule_date_v1'));
 f=fixture({allowRpc:true});assert(!contains(await CalendarPanel({operatorId:op,date:'2026-10-24'}),'InventoryHistoryPanel'));assert(contains(await CalendarPanel({operatorId:op,date:'2026-10-24',history:'1'}),'InventoryHistoryPanel'));
 const source=readFileSync(new URL('../../src/app/admin/operations-calendar.tsx',import.meta.url),'utf8');
 assert.match(source,/fromBookings\?'&fromBookings=1':''/);assert(!source.includes('ensure_schedule'));
});

test('sign-in return from the safe calendar handoff stays in read-only Bookings; ordinary calendar return is unchanged',async()=>{
 const {sectionAccess}=await import('../../src/app/admin/section-access.ts');const {AuthorizationError}=await import('../../src/modules/identity/authorization.ts');
 fixture();globalThis.bookingFixture.authorize=async()=>{throw new AuthorizationError('UNAUTHENTICATED');};
 for(const fromBookings of ['1',undefined]){
  await assert.rejects(sectionAccess('departures',{params:Promise.resolve({operatorId:op}),searchParams:Promise.resolve({date:'2026-10-24',fromBookings})}),e=>{
   const next=new URL(e.destination,'https://fixture.invalid').searchParams.get('next');return next===`/admin/${op}/${fromBookings?'bookings':'departures'}?date=2026-10-24`;
  });
 }
});

test('Tours static destinations skip operational reads and keep the existing departure permission',async()=>{
 const {CalendarPanel}=await import('../../src/app/admin/calendar-panel.tsx');
 for(const view of ['route','live']){const f=fixture();const result=await CalendarPanel({operatorId:op,view});assert.equal(result.props.view,view);assert.equal(f.calls.length,0);assert.deepEqual(f.checks,['departures.manage']);}
 const f=fixture({role:'content_editor'});await assert.rejects(CalendarPanel({operatorId:op,view:'today'}),/FORBIDDEN/);assert.equal(f.calls.length,0);
});
test('Tours Today uses a pure month projection and former product settings redirect without inventory preparation',async()=>{
 const {CalendarPanel}=await import('../../src/app/admin/calendar-panel.tsx');
 const f=fixture({allowRpc:true});const result=await CalendarPanel({operatorId:op,view:'today',date:'2026-10-24'});assert.equal(result.props.view,'today');assert(f.calls.some(c=>c.table==='read_operations_calendar_v1'));assert(!f.calls.some(c=>c.table==='ensure_schedule_date_v1'));assert(!f.calls.some(c=>['orders','bookings','inventory_holds'].includes(c.table)));
 for(const view of ['prices','tickets']){const f=fixture();await assert.rejects(CalendarPanel({operatorId:op,view}),e=>e.destination===`/admin/${op}/products`);assert.equal(f.calls.length,0);}

});
test('Tours incomplete schedule enumeration fails closed instead of presenting a partial total',async()=>{
 const {CalendarPanel}=await import('../../src/app/admin/calendar-panel.tsx');
 for(const capTable of ['service_schedules','products','vehicles']){fixture({allowRpc:true,capTable});const result=await CalendarPanel({operatorId:op,view:'today'});assert.match(result.props.error,/unavailable/i);assert.equal(result.props.projection,undefined);}
});
test('departure history reads never prepare service dates and navigation preserves query-based views',()=>{
 const history=readFileSync(new URL('../../src/app/admin/departures-panel.tsx',import.meta.url),'utf8');assert.doesNotMatch(history,/await prepareServiceDate|ensure_schedule_date/);assert.match(history,/action=\{loadDepartureDate/);
 const navigation=readFileSync(new URL('../../src/app/admin/admin-navigation.tsx',import.meta.url),'utf8');assert.match(navigation,/url.search/);
});
