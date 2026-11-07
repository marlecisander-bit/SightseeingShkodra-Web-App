import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
test('worker heartbeat is service-only, tenant bounded and stale runs cannot finish a newer run',async()=>{
 const db=await createTestDatabase();try{
 await loadDevelopmentFixtures(db);
 const op='10000000-0000-4000-8000-000000000001',first='10000000-0000-4000-8000-000000000080',second='10000000-0000-4000-8000-000000000081';
 await db.exec('set role authenticated');
 await assert.rejects(db.query('select * from admin_push_worker_status'),/permission denied/);await db.exec('reset role; set role service_role');
 await db.query("insert into admin_push_worker_status(operator_id,run_token,started_at,status) values($1,$2,now(),'running')",[op,second]);
 await db.query("update admin_push_worker_status set status='live',last_success_at=now() where operator_id=$1 and run_token=$2",[op,first]);
 assert.equal((await db.query('select status from admin_push_worker_status')).rows[0].status,'running');
 await db.query("update admin_push_worker_status set status='live',last_success_at=now() where operator_id=$1 and run_token=$2",[op,second]);
 assert.equal((await db.query('select status from admin_push_worker_status')).rows[0].status,'live');
 await db.exec('reset role');
 }finally{await db.close();}
});
