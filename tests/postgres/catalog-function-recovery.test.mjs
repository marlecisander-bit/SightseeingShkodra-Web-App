import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
import {randomBytes,randomUUID} from 'node:crypto';
import EmbeddedPostgres from 'embedded-postgres';
import {platformSql,loadDevelopmentFixtures} from '../helpers/database.mjs';

test('captured production Catalog function upgrades and recovers without changing commercial or historical rows',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'shkodra-recovery-'));
 let cluster,db;
 try {
  const socket=createServer();await new Promise((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve);});const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
  cluster=new EmbeddedPostgres({databaseDir:path.join(directory,'data'),port,user:'postgres',password:randomBytes(24).toString('hex'),persistent:true,createPostgresUser:false,authMethod:'scram-sha-256',postgresFlags:['-h','127.0.0.1'],onLog(){},onError(){}});
  await cluster.initialise();await cluster.start();db=cluster.getPgClient('postgres','127.0.0.1');await db.connect();await db.query("set statement_timeout='15s'");await db.query(platformSql);
  const migration='20261016000100_catalog_presentation_retirement.sql',dir=new URL('../../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.query(await readFile(new URL(file,dir),'utf8'));
  await loadDevelopmentFixtures({exec:sql=>db.query(sql)});
  const recovery=await readFile(new URL('../../docs/release/CMS-F04-PRODUCTION-FUNCTION-ROLLBACK.sql',import.meta.url),'utf8');
  // Establish the actual captured production routine (including its CRLF source) as baseline.
  await db.query(recovery);
  const op='10000000-0000-4000-8000-000000000001',uid=randomUUID();await db.query('insert into auth.users values($1)',[uid]);
  const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,uid])).rows[0].id;
  const active={title:'Recovery ticket',slug:'recovery-ticket',type:'van_tour',status:'published',inclusions:'Historical inclusions',supplier_id:'10000000-0000-4000-8000-000000000010'};
  const save=async(data,id=null)=>(await db.query('select save_catalog_v1($1,$2,\'product\',$3,$4,false) id',[op,actor,id,JSON.stringify(data)])).rows[0].id;
  const id=await save({...active,meta_title:'Historical SEO',meta_description:'Historical email',og_image:'https://example.invalid/history.webp',og_image_alt:'Historical alt'});
  await db.query(`update products set pricing_rules='{"version":1,"model":"per_guest","currency":"EUR","unit_price":1200}',capacity_rules='{"version":1,"model":"departure_seats"}' where id=$1`,[id]);
  const departure=(await db.query("insert into departures(operator_id,product_id,service_date,start_time,capacity,status) values($1,$2,'2030-06-01','09:00',3,'scheduled') returning id",[op,id])).rows[0].id;
  const session='recovery-'+randomUUID(),hold=(await db.query('select * from create_hold_v1($1,$2,$3,gen_random_uuid(),1)',[op,departure,session])).rows[0];
  await db.query("select create_meeting_point_booking_v1($1,$2,$3,'Synthetic recovery guest','recovery@example.invalid')",[op,hold.id,session]);
  const snapshot=async()=>{const result={};for(const {tablename}of (await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows)result[tablename]=(await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]') body from public."${tablename.replaceAll('"','""')}" t`)).rows[0].body;return result;};
  const functions=async()=>(await db.query("select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) body,p.proowner::regrole::text owner,p.prosecdef,p.proconfig,p.proacl::text acl,md5(p.prosrc) source_md5 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' order by signature")).rows;
  const availability=async()=>{const {as_of,...commercial}=(await db.query("select read_availability_v1($1,$2,'2030-06-01') body",[op,id])).rows[0].body;assert.ok(as_of);return commercial;};
  const before=await snapshot(),routines=await functions(),quote=await availability();assert.ok(before.bookings.length);assert.ok(before.booking_items.length);
  const signature='save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean)',original=routines.find(f=>f.signature===signature);assert.equal(original.source_md5,'85ce52d344f294065de2ad4b843bc964');assert.equal(original.owner,'postgres');assert.equal(original.prosecdef,false);assert.deepEqual(original.proconfig,['search_path=""']);
  await db.query(await readFile(new URL(migration,dir),'utf8'));assert.deepEqual(await snapshot(),before);assert.deepEqual(await availability(),quote);
  const upgraded=await functions();assert.deepEqual(upgraded.filter(f=>f.signature!==signature),routines.filter(f=>f.signature!==signature));
  for(const key of ['owner','prosecdef','proconfig','acl'])assert.deepEqual(upgraded.find(f=>f.signature===signature)[key],original[key]);
  // Verify old-client publication, then preserve a new metadata-free record across recovery.
  await db.query('begin');await save({...active,meta_title:'Old-client SEO',meta_description:'Old-client email'},id);await db.query('rollback');
  const fresh=await save({...active,slug:'post-upgrade-ticket'});const priorRollback=await snapshot();
  await db.query(recovery);assert.deepEqual(await snapshot(),priorRollback);assert.deepEqual(await functions(),routines);assert.deepEqual(await availability(),quote);
  assert.ok((await db.query('select read_public_homepage_v1($1,$2) body',[op,'post-upgrade-ticket'])).rows[0].body.product);
  // Restored validation rejects new-editor publication without legacy fields: application rollback must precede SQL rollback.
  await assert.rejects(save({...active,slug:'post-upgrade-ticket'},fresh),e=>e.code==='22023');
  for(const role of ['anon','authenticated']){assert.equal((await db.query('select has_function_privilege($1,$2,\'EXECUTE\') allowed',[role,signature])).rows[0].allowed,false);}
  assert.equal((await db.query('select has_function_privilege(\'service_role\',$1,\'EXECUTE\') allowed',[signature])).rows[0].allowed,true);
  await db.query(await readFile(new URL(migration,dir),'utf8'));assert.deepEqual(await snapshot(),priorRollback);assert.deepEqual(await functions(),upgraded);
 } finally {if(db)await db.end();if(cluster)await cluster.stop();await rm(directory,{recursive:true,force:true});}
},{timeout:90000});
