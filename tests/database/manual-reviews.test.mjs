import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
let db;const op='10000000-0000-4000-8000-000000000001';
before(async()=>{db=await createTestDatabase();await loadDevelopmentFixtures(db);});after(async()=>db?.close());
test('manual reviews default to unpublished and support independent business reviews',async()=>{
 const r=(await db.query("insert into reviews(operator_id,author,body,rating,source) values($1,'Test author','Exact test text',5,'Google Maps') returning *",[op])).rows[0];
 assert.equal(r.product_id,null);assert.equal(r.published,false);assert.equal(r.sync_source,'manual');assert.equal(r.body,'Exact test text');
 await assert.rejects(db.query("insert into reviews(operator_id,author,body,rating,source) values($1,'Test','text',6,'Direct')",[op]));
});
test('published selection prioritizes featured, order and excludes deleted/draft',async()=>{
 for(const [author,featured,order,published,deleted] of [['second',false,0,true,false],['first',true,5,true,false],['draft',true,0,false,false],['deleted',true,0,true,true]])await db.query("insert into reviews(operator_id,author,body,rating,source,featured,display_order,published,deleted_at) values($1,$2,'Test only',4,'Other',$3,$4,$5,case when $6 then now() end)",[op,author,featured,order,published,deleted]);
 const rows=(await db.query('select author from reviews where operator_id=$1 and published and deleted_at is null order by featured desc,display_order,created_at desc,id limit 3',[op])).rows;
 assert.deepEqual(rows.map(r=>r.author),['first','second']);
});
test('settings enforce limits and external identities are unique per operator/source',async()=>{
 await assert.rejects(db.query('insert into review_settings(operator_id,display_limit) values($1,7)',[op]));
 await db.query('insert into review_settings(operator_id) values($1)',[op]);
 assert.equal((await db.query('select display_limit from review_settings where operator_id=$1',[op])).rows[0].display_limit,3);
 await db.query("update reviews set external_id='source-review-test' where author='first'");
 await assert.rejects(db.query("update reviews set external_id='source-review-test' where author='second'"));
});
test('anonymous cannot read review records or settings and authenticated cannot mutate',async()=>{
 await db.exec('set role anon');await assert.rejects(db.query('select * from review_settings'));await assert.rejects(db.query('select * from reviews'));await db.exec('reset role; set role authenticated');
 await assert.rejects(db.query("update reviews set published=true"));assert.equal((await db.query('select * from reviews')).rows.length,0);await db.exec('reset role');
});
