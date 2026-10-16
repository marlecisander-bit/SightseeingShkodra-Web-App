import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {quoteAvailability} from '../../src/modules/booking/availability.ts';
import {loadHomepage} from '../../src/modules/content/homepage.ts';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
const op='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const migration='20261016000100_catalog_presentation_retirement.sql',dir=new URL('../../supabase/migrations/',import.meta.url);
const active={title:'Retained ticket',slug:'retained-ticket',type:'van_tour',status:'published',inclusions:'Retained admission information',supplier_id:'10000000-0000-4000-8000-000000000010'};
const legacy={meta_title:'Historical title',meta_description:'Historical email copy',og_image:'https://example.invalid/retained.webp',og_image_alt:'Historical image description'};
let db,id,beforeRows,afterRows,beforeColumns,afterColumns,beforeFunctions,afterFunctions,quoteBefore,quoteAfter,recoveryRows,recoveryFunctions;const actors={};
const read=async product=>(await db.query('select * from products where id=$1',[product])).rows[0];
const save=async(data,product=null,actor=actors.owner,operator=op,entity='product')=>(await db.query('select save_catalog_v1($1,$2,$3,$4,$5,false) id',[operator,actor,entity,product,JSON.stringify(data)])).rows[0].id;
async function snapshot(){const names=(await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows;const result={};for(const {tablename}of names)result[tablename]=(await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) body from public."${tablename.replaceAll('"','""')}" t`)).rows[0].body;return result;}
const columns=async()=>(await db.query("select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position")).rows;
const functions=async()=>(await db.query("select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) body,p.proacl::text acl,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' order by signature")).rows;
before(async()=>{
 db=new PGlite();await db.exec(platformSql);
 for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
 await loadDevelopmentFixtures(db);
 for(const role of ['owner','admin','content_editor','operations']){const uid=randomUUID();await db.query('insert into auth.users values($1)',[uid]);actors[role]=(await db.query('insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,$3) returning id',[op,uid,role])).rows[0].id;}
 id=await save({...active,...legacy});
 // Representative pre-upgrade commercial state: real confirmed booking, consumed hold and occupied seat.
 await db.query(`update products set pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1200}',capacity_rules='{"version":1,"model":"departure_seats"}' where id=$1`,[id]);
 const departure=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-06-01','09:00',3,'scheduled') returning id",[op,id])).rows[0].id;
 const session='release-upgrade-'+randomUUID();const hold=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,departure,session])).rows[0];
 await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Synthetic upgrade guest','upgrade@example.invalid')",[op,hold.id,session]);
 const request={version:1,operatorId:op,productId:id,date:'2030-06-01',guests:1};
 const quote=async()=>{const q=quoteAvailability(request,(await db.query('select read_availability_v1($1,$2,$3) data',[op,id,request.date])).rows[0].data);return {total:q.total,currency:q.currency,departures:q.departures.map(d=>({id:d.id,remaining:d.remaining,available:d.available}))};};
 quoteBefore=await quote();
 beforeRows=await snapshot();beforeColumns=await columns();beforeFunctions=await functions();
 await db.exec(await readFile(new URL(migration,dir),'utf8'));
 afterRows=await snapshot();afterColumns=await columns();afterFunctions=await functions();quoteAfter=await quote();
 // Rehearse restoring only the prior routine, retaining all rows, then reapplying forward SQL.
 await db.exec(await readFile(new URL('../../docs/release/CMS-F04-ROLLBACK-CATALOG.sql',import.meta.url),'utf8'));
 recoveryRows=await snapshot();recoveryFunctions=await functions();
 await assert.rejects(save({...active,slug:'old-validator-gate'}),e=>e.code==='22023');
 await db.exec(await readFile(new URL(migration,dir),'utf8'));
 assert.deepEqual(await snapshot(),afterRows);assert.deepEqual(await functions(),afterFunctions);
 await db.exec(await readFile(new URL('../../docs/release/CMS-F04-PREFLIGHT-READONLY.sql',import.meta.url),'utf8'));
});
after(async()=>db?.close());
test('migration preserves every seeded public row/column and changes only the Catalog routine body, retaining grants/security',()=>{
 assert.deepEqual(afterRows,beforeRows);assert.deepEqual(afterColumns,beforeColumns);assert.deepEqual(recoveryRows,beforeRows);assert.deepEqual(recoveryFunctions,beforeFunctions);assert.deepEqual(quoteAfter,quoteBefore);assert.equal(quoteAfter.total,1200);assert.equal(quoteAfter.departures[0].remaining,2);assert.ok(beforeRows.bookings.length);assert.ok(beforeRows.booking_items.length);
 assert.deepEqual(afterFunctions.map(f=>Object.fromEntries(Object.entries(f).filter(([key])=>key!=='body'))),beforeFunctions.map(f=>Object.fromEntries(Object.entries(f).filter(([key])=>key!=='body'))));
 const changed=afterFunctions.filter((f,i)=>f.body!==beforeFunctions[i].body).map(f=>f.signature);assert.deepEqual(changed,['save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean)']);
});
test('new products publish without any retired fields; historical published products stay readable',async()=>{
 const fresh=await save({...active,slug:'no-legacy-metadata'},null,actors.admin);const row=await read(fresh);assert.equal(row.status,'published');for(const key of Object.keys(legacy))assert.equal(row[key],null);
 const home=await loadHomepage({operatorId:op,productSlug:row.slug},{read:async(operator,slug)=>(await db.query('select read_public_homepage_v1($1,$2) data',[operator,slug])).rows[0].data,quote:async()=>{throw Error('Pricing intentionally unconfigured');}});assert.equal(home.state,'ready');assert.equal(home.product.id,fresh);assert.equal(home.product.description,null);assert.equal(home.schedule,'unavailable');
 const old=await read(id);assert.equal(old.status,'published');for(const [key,value]of Object.entries(legacy))assert.equal(old[key],value);
 const projection=(await db.query('select read_public_homepage_v1($1,$2) data',[op,active.slug])).rows[0].data;assert.equal(projection.product.id,id);assert.equal(projection.product.description,legacy.meta_description);
});
test('active-only current-form saves retain all legacy values and commercial configuration',async()=>{
 const before=await read(id);await save({...active,title:'Edited active title',pricing_rules:{unit_price:1},capacity_rules:{unexpected:true}},id);const after=await read(id);
 for(const key of [...Object.keys(legacy),'pricing_rules','capacity_rules','supplier_id','type','slug'])assert.deepEqual(after[key],before[key],key);assert.equal(after.title,'Edited active title');
});
test('older clients can still supply validated legacy values; omitted siblings remain intact',async()=>{
 await save({...active,...legacy,meta_title:'Old client title'},id);assert.equal((await read(id)).meta_title,'Old client title');
 await save({...active,og_image:'https://example.invalid/replacement.webp'},id);let row=await read(id);assert.equal(row.og_image_alt,legacy.og_image_alt);assert.equal(row.og_image,'https://example.invalid/replacement.webp');assert.equal(row.meta_description,legacy.meta_description);
 await assert.rejects(save({...active,og_image_alt:''},id),e=>e.code==='22023');
 await assert.rejects(save({...active,og_image:'http://example.invalid/unsafe.webp'},id),e=>e.code==='22023');
 await assert.rejects(save({...active,meta_title:'x'.repeat(201)},id),e=>e.code==='22023');
 await assert.rejects(save({...active,meta_description:'x'.repeat(501)},id),e=>e.code==='22023');
});
test('invalid active Catalog fields, foreign suppliers and malformed requests remain rejected without writes',async()=>{
 const foreignSupplier=(await db.query("insert into suppliers(operator_id,name,type) values($1,'Foreign supplier','partner') returning id",[other])).rows[0].id;
 const before=await read(id);for(const invalid of [{title:''},{title:'x'.repeat(201)},{slug:''},{slug:'Bad Slug!'},{status:'invented'},{type:'invented'},{inclusions:'x'.repeat(701)},{supplier_id:'10000000-0000-4000-8000-000000000002'},{supplier_id:foreignSupplier}])await assert.rejects(save({...active,...invalid},invalid.slug==='Bad Slug!'?null:id),invalid.slug==='Bad Slug!'?e=>e.code==='23514':e=>['22023','23503'].includes(e.code));
 await assert.rejects(save({...active,slug:'changed-binding'},id),e=>e.code==='42501');
 await assert.rejects(save([]),e=>e.code==='22023');assert.deepEqual(await read(id),before);
});
test('editor, operations, disabled publisher, foreign actor/operator and public SQL roles cannot publish',async()=>{
 for(const role of ['content_editor','operations'])await assert.rejects(save(active,id,actors[role]),e=>e.code==='42501');
 await assert.rejects(save(active,id,randomUUID()),e=>e.code==='42501');await assert.rejects(save(active,id,actors.owner,other),e=>e.code==='42501');
 await db.query('update staff_profiles set is_active=false where id=$1',[actors.admin]);await assert.rejects(save(active,id,actors.admin),e=>e.code==='42501');
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{await assert.rejects(save(active,id),e=>e.code==='42501');}finally{await db.exec('reset role');}}
 await assert.rejects(save({...active,slug:'foreign'},'10000000-0000-4000-8000-000000000021'),e=>e.code==='P0002');
});
test('unchanged supplier validation remains enforced',async()=>{
 await assert.rejects(save({name:'Supplier',type:'invented'},null,actors.owner,op,'supplier'),e=>e.code==='22023');
 await assert.rejects(save({name:'',type:'owned'},null,actors.owner,op,'supplier'),e=>e.code==='22023');
});

test('unusual historical presentation values remain byte-for-byte intact when omitted by the new editor',async()=>{
 const product=await save({...active,slug:'historic-presentation-values'});
 const values={meta_title:'  Historical spacing  ',meta_description:'  Email copy  ',og_image:'http://example.invalid/historical.webp',og_image_alt:'  Old alt  '};
 await db.query('update products set meta_title=$2,meta_description=$3,og_image=$4,og_image_alt=$5 where id=$1',[product,...Object.values(values)]);
 await save({...active,slug:'historic-presentation-values'},product);const row=await read(product);for(const [key,value]of Object.entries(values))assert.equal(row[key],value);
});
