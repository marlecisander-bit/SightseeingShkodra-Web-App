import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {createTestDatabase,loadDevelopmentFixtures,setTestClock} from '../helpers/database.mjs';
import {initialWebsiteContent,validateWebsiteContent,safeWebsiteLink} from '../../src/modules/content/website-schema.ts';
import {editorialSections} from '../../src/modules/content/editorial-fields.ts';
import {blankDestination} from '../../src/modules/content/destinations.ts';
import {meetingPoint} from '../../src/modules/booking/meeting-point.ts';
let db;const op='10000000-0000-4000-8000-000000000001', actors={};
before(async()=>{db=await createTestDatabase({now:'2030-06-01T06:00:00Z'});await loadDevelopmentFixtures(db);for(const role of ['owner','admin','content_editor','operations']){const u=randomUUID();await db.query('insert into auth.users values($1)',[u]);actors[role]=(await db.query('insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,$3) returning id',[op,u,role])).rows[0].id;}});
after(async()=>db?.close());
const save=async(c,operation,role='owner',stamp=null)=>(await db.query('select * from save_website_content_v1($1,$2,$3,$4,$5)',[op,actors[role],c,stamp,operation])).rows[0];
const read=async()=> (await db.query("select *,updated_at::text stamp from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
test('every added field saves privately, publishes together and restores with conflict protection',async()=>{
 await save(initialWebsiteContent,'initialize');let row=await read();
 const changed={...initialWebsiteContent};for(const f of editorialSections.flatMap(s=>s.fields))changed[f.key]=f.kind==='image'?'/images/castle.webp':f.key==='homeRoute.title'?'Test route {count}':'Draft '+f.key;
 assert.deepEqual(validateWebsiteContent(changed),changed);
 await save(changed,'draft','content_editor',row.stamp);let draft=await read();
 assert.deepEqual(draft.body.content,changed);assert.deepEqual(draft.published_body.content,initialWebsiteContent);
 await assert.rejects(save(changed,'publish','content_editor',draft.stamp),e=>e.code==='42501');
 await assert.rejects(save(changed,'draft','operations',draft.stamp),e=>e.code==='42501');
 await assert.rejects(save(changed,'publish','owner',row.stamp),e=>e.code==='PT409');
 await save(changed,'publish','admin',draft.stamp);assert.deepEqual((await read()).published_body.content,changed);
 await save(initialWebsiteContent,'publish','owner',(await read()).stamp);assert.deepEqual((await read()).published_body.content,initialWebsiteContent);
});
test('sensitive saved drafts require owner publication and cannot be changed by editors',async()=>{
 const changed={...initialWebsiteContent,'footer.businessName':'Owner only business'};
 // Use an actual sensitive stored field, not a newly invented key.
 delete changed['footer.businessName'];changed['whatsapp.message']='Owner contact message';
 await assert.rejects(save(changed,'draft','content_editor',(await read()).stamp),e=>e.code==='42501');
 await save(changed,'draft','owner',(await read()).stamp);
 await assert.rejects(save(changed,'publish','admin',(await read()).stamp),e=>e.code==='42501');
 await save(initialWebsiteContent,'publish','owner',(await read()).stamp);
});
test('routes and placeholders agree across application and database; unpublished destinations denied',async()=>{
 for(const link of ['/route','/live','/#route','/tour#faq','/privacy-policy']){assert.ok(safeWebsiteLink(link));await save({...initialWebsiteContent,'nav.0.link':link},'draft','owner',(await read()).stamp);}
 for(const link of ['javascript:alert(1)','//evil.test','/made-up-route'])assert.equal(safeWebsiteLink(link),false);
 await assert.rejects(save({...initialWebsiteContent,'nav.0.link':'/explore/not-published'},'draft','owner',(await read()).stamp),e=>e.code==='22023');
 await assert.rejects(save({...initialWebsiteContent,'homeRoute.title':'{manual}'},'draft','owner',(await read()).stamp),e=>e.code==='22023');
 await save(initialWebsiteContent,'publish','owner',(await read()).stamp);
});
test('dynamic published destinations and aliases are allowed; drafting cannot reorder live cards',async()=>{
 const dest={...blankDestination,slug:'new-public-guide',name:'Synthetic guide',text:'Synthetic story',seoTitle:'Synthetic title',seoDescription:'Synthetic summary',image:'/images/lake.webp',alt:'Synthetic lake'};
 const id=(await db.query("select save_destination_v1($1,$2,null,$3,'publish',4,null) id",[op,actors.owner,dest])).rows[0].id;
 await save({...initialWebsiteContent,'nav.0.link':'/explore/new-public-guide'},'draft','owner',(await read()).stamp);
 const stamp=async()=>(await db.query('select updated_at::text stamp from content_pages where id=$1',[id])).rows[0].stamp;
 await db.query("select save_destination_v1($1,$2,$3,$4,'draft',0,$5)",[op,actors.content_editor,id,{...dest,text:'Draft-only story'},await stamp()]);
 assert.equal((await db.query('select destination_order n from content_pages where id=$1',[id])).rows[0].n,4);
 await assert.rejects(db.query("select save_destination_v1($1,$2,$3,$4,'publish',4,$5)",[op,actors.content_editor,id,dest,await stamp()]),e=>e.code==='42501');
 await db.query("select save_destination_v1($1,$2,$3,$4,'publish',4,$5)",[op,actors.owner,id,{...dest,slug:'renamed-public-guide'},await stamp()]);
 for(const slug of ['new-public-guide','renamed-public-guide'])await save({...initialWebsiteContent,'nav.0.link':'/explore/'+slug},'draft','owner',(await read()).stamp);
 await save(initialWebsiteContent,'publish','owner',(await read()).stamp);
});
test('product bindings are protected in the database and ordinary copy remains editable',async()=>{
 const id='10000000-0000-4000-8000-000000000020';
 await assert.rejects(db.query("update products set slug='replacement' where id=$1",[id]),e=>e.code==='42501');
 await assert.rejects(db.query("update products set type='boat_trip' where id=$1",[id]),e=>e.code==='42501');
 await db.query("update products set title='Updated ticket copy' where id=$1",[id]);
 await assert.rejects(db.query('select save_passenger_pricing_v1($1,$2,$3,$4,now())',[op,actors.operations,id,{}]),e=>e.code==='42501');
});
test('operations can schedule while commercial values and restoration remain protected',async()=>{
 const product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules) values($1,'van_tour','Schedule permissions','schedule-permissions','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}') returning id`,[op])).rows[0].id;
 const schedule=(await db.query("select save_service_schedule_v1($1,$2,$3,'2030-06-01','2030-06-30',$4,$5,8,null,'active') id",[op,actors.operations,product,[1,2,3,4,5,6,7],[{time:'13:00'}]])).rows[0].id;
 const stamp=async()=>(await db.query('select updated_at::text stamp from service_schedules where id=$1',[schedule])).rows[0].stamp;
 const override=async(role,value,restore=false)=>db.query('select save_calendar_override_v1($1,$2,$3,$4,$4,$5,$6,false,$7,$8)',[op,actors[role],schedule,'2030-06-04',[1,2,3,4,5,6,7],value,await stamp(),restore]);
 await override('operations',{capacity:7});
 await assert.rejects(override('operations',{prices:{adult:800}}),e=>e.code==='42501');
 await override('owner',{prices:{adult:800}});
 await assert.rejects(override('operations',{},true),e=>e.code==='42501');
 await assert.rejects(override('operations',{capacity:6}),e=>e.code==='42501');
 await override('operations',{prices:{adult:800},capacity:6});
 await assert.rejects(db.query("select save_content_page_v1($1,$2,$3,$4,$5)",[op,actors.admin,(await read()).id,{slug:'website-homepage',title:'Bypass',status:'draft'},(await read()).stamp]),e=>e.code==='42501');
});
test('effective meeting point freezes at confirmation and survives setting and booking changes',async()=>{
 const product=(await db.query(`insert into products(operator_id,type,title,slug,status,pricing_rules,capacity_rules,passenger_pricing) values($1,'van_tour','Isolated test','isolated-meeting','published','{"version":1,"model":"per_guest","currency":"EUR","unit_price":1000}','{"version":1,"model":"departure_seats"}','{"adult":{"min":13,"max":null,"price":1000},"child":{"min":3,"max":12,"price":500},"infant":{"min":0,"max":2,"price":0}}') returning id`,[op])).rows[0].id;
 const dep=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-06-02','13:00',8,'scheduled') returning id",[op,product])).rows[0].id;
 async function book(){const session='isolated-meeting-point-session-123456789';const h=(await db.query('select * from create_passenger_hold_v1($1,$2,$3,$4,1,$5)',[op,dep,session,randomUUID(),{adult:1,child:0,infant:0}])).rows[0];return(await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Synthetic','test@example.invalid') b",[op,h.id,session])).rows[0].b;}
 const old=await book();const next={...meetingPoint,name:'Future boarding',directions:'Synthetic directions',url:'https://maps.app.goo.gl/Example123'};
 await assert.rejects(db.query('select save_meeting_point_v1($1,$2,$3,$4,null)',[op,actors.admin,next,'2030-06-01T07:00:00Z']),e=>e.code==='42501');
 await db.query('select save_meeting_point_v1($1,$2,$3,$4,null)',[op,actors.owner,next,'2030-06-01T07:00:00Z']);
 assert.deepEqual(old.meetingPoint,meetingPoint);
 const before=await book();await setTestClock(db,'2030-06-01T08:00:00Z');const newer=await book();assert.deepEqual(newer.meetingPoint,next);
 const readBooking=async(b)=>(await db.query('select customer_booking_v1($1) b',[b.managementToken])).rows[0].b;
 assert.deepEqual((await readBooking(old)).meetingPoint,meetingPoint);assert.deepEqual((await readBooking(before)).meetingPoint,meetingPoint);assert.deepEqual((await readBooking(newer)).meetingPoint,next);
 await db.query('select modify_customer_booking_v1($1,0,$2,$3,1000,$4)',[old.managementToken,dep,{adult:1,child:0,infant:1},randomUUID()]);assert.deepEqual((await readBooking(old)).meetingPoint,meetingPoint);
 await assert.rejects(db.query('update bookings set meeting_point_snapshot=$1 where order_id=$2',[next,old.orderId]),e=>e.code==='42501');
 for(const b of [old,before,newer])await db.query('select cancel_customer_booking_v1($1)',[b.managementToken]);
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_table_privilege($1,'meeting_point_versions','insert') ok",[role])).rows[0].ok,false);
});
