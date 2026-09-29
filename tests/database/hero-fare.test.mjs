import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
import {quoteAvailability} from '../../src/modules/booking/availability.ts';
import {adultHeroFare,nextHeroFare} from '../../src/modules/content/hero-fare.ts';
let db,actor,product,schedule;
const op='10000000-0000-4000-8000-000000000001',counts={adult:1,child:0,infant:0};
const config={adult:{min:13,max:null,price:1000},child:{min:3,max:12,price:500},infant:{min:0,max:2,price:0}};
const stamp=async(table,id)=>(await db.query(`select updated_at::text as stamp from ${table} where id=$1`,[id])).rows[0].stamp;
const request=date=>({version:1,operatorId:op,productId:product,date,guests:1,passengers:counts});
async function quote(req){const {rows}=await db.query('select read_passenger_availability_v1($1,$2,$3,$4) q',[op,product,req.date,JSON.stringify(counts)]);return quoteAvailability(req,rows[0].q);}
async function fare(date){return nextHeroFare(await quote(request(date)),request(date),{quote,nextDate:async after=>(await db.query('select next_operational_date_v1($1,$2,$3)::text d',[op,product,after])).rows[0].d});}
async function override(from,to,value){await db.query('select save_calendar_override_v1($1,$2,$3,$4,$5,$6,$7,false,$8)',[op,actor,schedule,from,to,[1,2,3,4,5,6,7],JSON.stringify(value),await stamp('service_schedules',schedule)]);}
before(async()=>{
 db=await createTestDatabase({now:'2026-09-23T18:00:00Z'});await loadDevelopmentFixtures(db);
 const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;
 product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules) values($1,'van_tour','Hero price test','hero-price-test','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}') returning id`,[op])).rows[0].id;
 schedule=(await db.query("select save_service_schedule_v1($1,$2,$3,'2026-09-24','2026-10-31',$4,$5,8,null,'active') id",[op,actor,product,[1,2,3,4,5,6,7],JSON.stringify([{time:'09:00'},{time:'15:00'}])])).rows[0].id;
 await db.query('select save_passenger_pricing_v1($1,$2,$3,$4,$5)',[op,actor,product,JSON.stringify(config),await stamp('products',product)]);
});
after(async()=>db?.close());
test('hero next service date uses the same EUR10 adult quote as booking',async()=>{
 const teaser=await fare('2026-09-23');assert.deepEqual(teaser,{date:'2026-09-24',currency:'EUR',amount:1000});
 assert.equal((await quote(request(teaser.date))).departures[0].passengerQuote.total,teaser.amount);
});
test('admin adult price change EUR10 to EUR12 updates both consumers without homepage edit',async()=>{
 await db.query('select save_passenger_pricing_v1($1,$2,$3,$4,$5)',[op,actor,product,JSON.stringify({...config,adult:{...config.adult,price:1200}}),await stamp('products',product)]);
 const teaser=await fare('2026-09-23');assert.equal(teaser.amount,1200);assert.equal((await quote(request(teaser.date))).departures[0].passengerQuote.total,1200);
});
test('seasonal and departure offer prices remain canonical adult quotes',async()=>{
 await override('2026-10-01','2026-10-15',{prices:{adult:1500,child:100}});
 await override('2026-10-07','2026-10-07',{offer:{name:'Test offer',label:'Local test',type:'percent',values:{adult:20},times:['15:00']}});
 const booking=await quote(request('2026-10-07'));assert.equal(adultHeroFare(booking).amount,1200);
 assert.deepEqual(booking.departures.map(d=>d.passengerQuote.total),[1500,1200]);
});
test('closed and sold-out dates are skipped; no zero or child price is advertised',async()=>{
 await override('2026-09-24','2026-09-24',{closed:true});
 const q=await quote(request('2026-09-25'));
 for(const d of q.departures)await db.query('select create_passenger_hold_v1($1,$2,$3,gen_random_uuid(),8,$4)',[op,d.id,'hero-price-test-session-123456789012345',JSON.stringify({adult:8,child:0,infant:0})]);
 assert.equal((await fare('2026-09-23')).date,'2026-09-26');
 assert.equal(adultHeroFare({...q,departures:q.departures.map(d=>({...d,passengerQuote:{...d.passengerQuote,counts:{adult:0,child:1,infant:0}}}))}),undefined);
 assert.equal(adultHeroFare({...q,departures:q.departures.map(d=>({...d,passengerQuote:{...d.passengerQuote,lines:[{category:'adult',quantity:1,total:0}]}}))}),undefined);
});
