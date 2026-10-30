import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
let db,actor,source,product;
const op='10000000-0000-4000-8000-000000000001',van='10000000-0000-4000-8000-000000000030';
const stamp=async id=>(await db.query('select updated_at from products where id=$1',[id])).rows[0].updated_at;
async function save(operation,patch={},id=product,time){return(await db.query('select save_product_workspace_v1($1,$2,$3,$4,$5,$6) id',[op,actor,id,time??(id?await stamp(id):null),operation,patch])).rows[0].id;}
before(async()=>{db=await createTestDatabase({now:'2030-06-10T04:00:00Z'});await loadDevelopmentFixtures(db);const u=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,u])).rows[0].id;source=(await db.query("select id from products where operator_id=$1 and type='van_tour' limit 1",[op])).rows[0].id;await db.query("update products set status='published',capacity_rules='{\"version\":1,\"model\":\"departure_seats\"}' where id=$1",[source]);await db.query(`select save_service_schedule_v1($1,$2,$3,'2030-06-10','2030-06-30',array[1,2,3,4,5,6,7],'[{"time":"09:00"},{"time":"11:00"}]',8,$4,'active',null)`,[op,actor,source,van]);});
after(async()=>db?.close());
test('create draft, incomplete setup blockers and private editorial saves',async()=>{
 product=await save('create',{title:'Synthetic loop'},null);
 const p=(await db.query('select * from products where id=$1',[product])).rows[0];assert.equal(p.status,'draft');
 const b=(await db.query('select product_publish_blockers_v1($1,$2) b',[op,product])).rows[0].b;assert(b.some(s=>s.includes('photo')));assert(b.some(s=>s.includes('schedule')));assert(b.some(s=>s.includes('child price')));
 await save('draft',{title:'New draft title',card:{image:'',alt:'',description:'Private introduction',order:2,enabled:true}});
 assert.equal((await db.query('select title from products where id=$1',[product])).rows[0].title,'Synthetic loop');
 const before=(await db.query('select title,status,card_draft,card_published,editor_draft,(select count(*) from domain_events) events from products where id=$1',[product])).rows[0];
 await assert.rejects(save('publish'),/photo/);
 assert.deepEqual((await db.query('select title,status,card_draft,card_published,editor_draft,(select count(*) from domain_events) events from products where id=$1',[product])).rows[0],before);
 assert.equal((await db.query('select card_published from products where id=$1',[product])).rows[0].card_published,null);
});
test('configured product publishes as one product without duplicating inventory',async()=>{
 await db.query("select save_product_booking_v1($1,$2,$3,$4,'selected_departure',120,$5)",[op,actor,product,source,await stamp(product)]);
 await db.query(`select save_passenger_pricing_v1($1,$2,$3,'{"adult":{"min":13,"max":null,"price":1000},"child":{"min":3,"max":12,"price":800},"infant":{"min":0,"max":2,"price":0}}',$4)`,[op,actor,product,await stamp(product)]);
 await save('publish',{card:{image:'/images/hero.webp',alt:'Synthetic photo',description:'A loop',order:2,enabled:true,features:['audio_guide']}});
 const p=(await db.query('select * from products where id=$1',[product])).rows[0];assert.equal(p.title,'New draft title');assert.equal(p.status,'published');assert.equal(p.card_published.enabled,true);assert.equal(p.inventory_product_id,source);
 const directory=(await db.query('select read_public_products_v1($1) d',[op])).rows[0].d;assert(directory.some(p=>p.id===product));assert.equal(directory.find(p=>p.id===product).adultPrice,1000);assert.deepEqual(directory.find(p=>p.id===product).card.features,['audio_guide']);assert.equal((await db.query('select count(*) n from service_schedules where product_id=$1',[product])).rows[0].n,0);
});
test('private edits, stale saves, pause and rejected media preserve public data',async()=>{
 const old=await stamp(product);await save('draft',{title:'Still private'});await assert.rejects(save('publish',{},product,old),/changed/);
 assert.equal((await db.query('select title from products where id=$1',[product])).rows[0].title,'New draft title');
 await assert.rejects(save('draft',{card:{image:'https://evil.invalid/image.jpg',alt:'X',description:'X',order:0,enabled:true}}),/Invalid image/);
 await save('pause');const p=(await db.query('select status,title,card_published from products where id=$1',[product])).rows[0];assert.equal(p.status,'draft');assert.equal(p.title,'New draft title');assert.equal(p.card_published.description,'A loop');
});
test('tenant and role enforcement applies at SQL boundary',async()=>{
 const owner=actor;const u=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'content_editor') returning id",[op,u])).rows[0].id;
 await save('draft',{title:'Editor draft'});await assert.rejects(save('publish'),/permission/i);await assert.rejects(save('pause'),/permission/i);await assert.rejects(save('create',{title:'No'},null),/permission/i);
 await assert.rejects(db.query("select save_product_workspace_v1(gen_random_uuid(),$1,$2,$3,'draft','{}')",[owner,product,await stamp(product)]),/permission/i);actor=owner;
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'public.save_product_workspace_v1(uuid,uuid,uuid,timestamptz,text,jsonb)','execute') allowed",[role])).rows[0].allowed,false);
});

test('feature badges reject unsupported claims and malformed lists atomically',async()=>{
 const before=(await db.query('select card_published,editor_draft from products where id=$1',[product])).rows[0];
 for(const features of [['invented_claim'],{},Array(7).fill('wifi')])await assert.rejects(save('draft',{card:{image:'/images/lake.webp',alt:'Lake',description:'',order:0,enabled:true,features}}),/Invalid product features/);
 assert.deepEqual((await db.query('select card_published,editor_draft from products where id=$1',[product])).rows[0],before);
});
test('amenity icons and ticket labels are validated, published per product and do not change seat policy',async()=>{
 const before=(await db.query('select seat_reservation_mode,reservation_minutes,inventory_product_id from products where id=$1',[product])).rows[0];
 for(const [features,feature_icons]of [[['full_day_ticket','two_hours_ticket'],{}],[['wifi'],{wifi:'<script>'}],[['wifi'],{live_tracking:'map'}],[['wifi'],[]]])await assert.rejects(save('draft',{card:{image:'/images/lake.webp',alt:'Lake',description:'',order:0,enabled:true,features,feature_icons}}),/ticket|icons/);
 await save('publish',{card:{image:'/images/lake.webp',alt:'Lake',description:'',order:0,enabled:true,features:['full_day_ticket','multilingual_audio_guide','air_conditioning','live_tracking','hop_on_hop_off'],feature_icons:{multilingual_audio_guide:'headphones',full_day_ticket:'clock'}}});
 assert.deepEqual((await db.query('select seat_reservation_mode,reservation_minutes,inventory_product_id from products where id=$1',[product])).rows[0],before);
 const p=(await db.query('select read_public_products_v1($1) d',[op])).rows[0].d.find(p=>p.id===product);assert.equal(p.card.feature_icons.multilingual_audio_guide,'headphones');assert(p.card.features.includes('full_day_ticket'));
});
