import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createTestDatabase,loadDevelopmentFixtures} from '../helpers/database.mjs';
let db,actor; const op='10000000-0000-4000-8000-000000000001',product='10000000-0000-4000-8000-000000000020';
before(async()=>{db=await createTestDatabase();await loadDevelopmentFixtures(db);const user=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,user])).rows[0].id;});
after(async()=>db.close());
async function stamp(){return (await db.query('select updated_at::text stamp from products where id=$1',[product])).rows[0].stamp;}
const save=(price,version,operator=op)=>db.query('select save_product_pricing_v1($1,$2,$3,$4,$5)',[operator,actor,product,price,version]);
test('price editor stores exact cents and seat model, audits changes and rejects stale updates',async()=>{
 const previous=await stamp();await save('12.50',previous);
 const p=(await db.query('select pricing_rules,capacity_rules from products where id=$1',[product])).rows[0];
 assert.deepEqual(p.pricing_rules,{version:1,model:'per_guest',currency:'EUR',unit_price:1250});assert.deepEqual(p.capacity_rules,{version:1,model:'departure_seats'});
 await assert.rejects(save('15.00',previous),e=>e.code==='PT409');
 assert.equal((await db.query("select count(*)::int n from audit_logs where entity_id=$1 and action='product.pricing_changed'",[product])).rows[0].n,1);
 for(const invalid of ['-1','12,50','1.001','NaN','1e2','90071992547409.92',''])await assert.rejects(save(invalid,await stamp()),e=>e.code==='22023');
 await save('0',await stamp());assert.equal((await db.query('select unit_price_v1(pricing_rules) as price from products where id=$1',[product])).rows[0].price,0);
});
test('price editor denies foreign, operations, editor and anonymous writes',async()=>{
 await assert.rejects(save('10',await stamp(),'10000000-0000-4000-8000-000000000002'),e=>e.code==='42501');
 for(const role of ['operations','content_editor']){await db.query('update staff_profiles set role=$1 where id=$2',[role,actor]);await assert.rejects(save('10',await stamp()),e=>e.code==='42501');}
 await db.query("update staff_profiles set role='admin' where id=$1",[actor]);await save('10',await stamp());
 await db.query("update staff_profiles set is_active=false where id=$1",[actor]);await assert.rejects(save('10',await stamp()),e=>e.code==='42501');
 const version=await stamp();for(const role of ['anon','authenticated']){await db.exec('set role '+role);try{await assert.rejects(save('10',version),e=>e.code==='42501');}finally{await db.exec('reset role');}}
});
