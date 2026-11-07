import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';
test('availability migration defaults existing products active and preserves current public order, editorial content and prices',async()=>{
 const db=new PGlite();try{
 await db.exec(platformSql);const dir=new URL('../../supabase/migrations/',import.meta.url),migration='20261107000100_product_availability_order.sql';
 for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.exec(await readFile(new URL(f,dir),'utf8'));
 await loadDevelopmentFixtures(db);
 const op='10000000-0000-4000-8000-000000000001';
 await db.query(`update products set status='published',capacity_rules='{"version":1,"model":"departure_seats"}',card_published=jsonb_build_object('order',case when title like '%Day%' then 9 else 2 end,'enabled',true,'description','Preserve this') where operator_id=$1`,[op]);
 const read=async()=>(await db.query('select id,title,slug,status,pricing_rules,passenger_pricing,card_published,editor_draft from products where operator_id=$1 order by coalesce((card_published->>\'order\')::integer,0),title,id',[op])).rows;
 const before=await read();await db.exec(await readFile(new URL(migration,dir),'utf8'));assert.deepEqual(await read(),before);
 const after=(await db.query('select id,active,unavailable_message from products where operator_id=$1 order by display_order,title,id',[op])).rows;
 assert.deepEqual(after.map(p=>p.id),before.map(p=>p.id));assert(after.every(p=>p.active&&p.unavailable_message===''));
 }finally{await db.close();}
});
