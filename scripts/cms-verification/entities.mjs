import assert from 'node:assert/strict';
import {preparedContent} from './fixtures.mjs';
import {entityRender,syntheticDestination,renderConsumer,homeData,planner} from './render.mjs';
import {destinationPlace} from '../../src/modules/content/destinations.ts';
import {sightseeingStops} from '../../src/modules/content/sightseeing-stops.ts';
import {catalogFields,retainedCatalogPresentationKeys} from '../../src/modules/content/catalog-fields.ts';
import {meetingPoint} from '../../src/modules/booking/meeting-point.ts';
export function assertCatalogRetirement(inventory=catalogFields.product){
 assert.deepEqual(inventory.map(f=>f.key).sort(),['title','slug','type','status','inclusions'].sort(),'Catalog active inventory changed; review explicit probes');
 for(const key of retainedCatalogPresentationKeys)assert.ok(!inventory.some(f=>f.key===key),'Retired Catalog control became active: '+key);
}
export async function verifyEntities({db,actors,fields,check,catalogCompatibility}){
 const op='10000000-0000-4000-8000-000000000001',c=preparedContent();
 const tracked=async(name,consumer,fn)=>{let error;await check('entities.'+name,'real SQL persistence + '+consumer,async()=>{try{await fn();}catch(e){error=e;throw e;}});fields.push({field:name,classification:'entity lifecycle',owner:name.split('.')[0],consumer,connectivity:'Explicit consumer/boundary probe',status:error?'FAIL':'PASS',error:error?.message,method:'See named independent check',evidence:'entities.'+name,limitations:['Local synthetic SQL and public projection; not hosted UI authentication.']});};
 await tracked('destinations.draft_publish_association','GuideView + sightseeingStops',async()=>{
 const base={...syntheticDestination(),guidePublished:true};const id=(await db.query("select save_destination_v1($1,$2,null,$3,'publish',4,null) id",[op,actors.owner,base])).rows[0].id;
 const read=async()=>(await db.query('select *,updated_at::text stamp from content_pages where id=$1',[id])).rows[0];
 const save=async(body,action,role)=>db.query('select save_destination_v1($1,$2,$3,$4,$5,4,$6)',[op,actors[role],id,body,action,(await read()).stamp]);
 const next={...base,name:'VERIFY changed destination',story:'VERIFY changed story',guidePublished:true};
 await save(next,'draft','content_editor');let row=await read();assert.deepEqual(row.body,next);assert.deepEqual(row.published_body,base);
 // The same public component receives saved draft versus published projection.
 assert.ok(entityRender('destination',[{...row,published_body:row.body}],c).includes(next.story));assert.ok(!entityRender('destination',[row],c).includes(next.story));
 for(const role of ['content_editor','operations'])await assert.rejects(save(next,'publish',role),e=>e.code==='42501');
 for(const action of ['earlier','later']){await assert.rejects(save(next,action,'content_editor'),e=>e.code==='42501');for(const role of ['owner','admin'])await save(next,action,role);}
 await save(next,'publish','admin');row=await read();assert.deepEqual(row.published_body,next);assert.ok(entityRender('destination',[row],c).includes(next.story));assert.deepEqual((await read()).published_body,next);
 const stops=sightseeingStops(planner.stops,[destinationPlace(row)]);assert.equal(stops[0].place.name,next.name);assert.equal(stops[0].place.link,'/explore/synthetic-guide');assert.equal(sightseeingStops(planner.stops,[])[0].place,undefined);assert.equal(sightseeingStops(planner.stops,[destinationPlace(row),destinationPlace(row)])[0].place,undefined);
 });
 await tracked('partners.immediate_active_publication','PartnersSection + anonymous RLS',async()=>{
 const id=(await db.query("insert into partners(operator_id,name,logo_url,website_url,description,is_active) values($1,'VERIFY partner','/images/lake.webp','https://example.invalid/partner','VERIFY relationship',false) returning id",[op])).rows[0].id;
 const read=async()=>(await db.query('select * from partners where operator_id=$1 and id=$2',[op,id])).rows[0];
 assert.equal((await read()).is_active,false);assert.ok(!entityRender('partners',[],c).includes('id="partners"'));assert.ok(!entityRender('partners',[],c).includes('VERIFY partner'));await db.exec('set role anon');assert.equal((await db.query('select * from partners where id=$1',[id])).rows.length,0);await assert.rejects(db.query('update partners set is_active=true where id=$1',[id]),e=>e.code==='42501');await db.exec('reset role');
 await db.query('update partners set is_active=true where id=$1',[id]);const fresh=await read();await db.exec('set role anon');const publicRows=(await db.query('select * from partners where id=$1',[id])).rows;await db.exec('reset role');assert.equal(publicRows.length,1);const html=entityRender('partners',publicRows,c);assert.ok(html.includes(fresh.name));assert.ok(html.includes(fresh.description));assert.ok(html.includes(fresh.website_url));assert.deepEqual(await read(),fresh);
 await db.query('update partners set is_active=false where id=$1',[id]);await db.exec('set role anon');assert.equal((await db.query('select * from partners where id=$1',[id])).rows.length,0);await db.exec('reset role');
 });
 await tracked('reviews.publication_soft_delete','GuestReviews with published selection',async()=>{
 const id=(await db.query("insert into reviews(operator_id,author,rating,body,source,published) values($1,'VERIFY author',5,'VERIFY review body','Other',false) returning id",[op])).rows[0].id;
 const selected=async()=>(await db.query('select * from reviews where operator_id=$1 and id=$2 and published and deleted_at is null',[op,id])).rows;
 assert.equal((await selected()).length,0);assert.ok(!entityRender('reviews',await selected(),c).includes('VERIFY review body'));
 await db.query('update reviews set published=true where id=$1',[id]);assert.ok(entityRender('reviews',await selected(),c).includes('VERIFY review body'));assert.deepEqual(await selected(),await selected());
 await db.exec('set role anon');await assert.rejects(db.query('update reviews set published=true where id=$1',[id]),e=>e.code==='42501');await db.exec('reset role');
 await db.query('update reviews set deleted_at=now() where id=$1',[id]);assert.equal((await selected()).length,0);assert.equal((await db.query('select body from reviews where id=$1',[id])).rows[0].body,'VERIFY review body');
 });
 await check('entities.catalog.persistence_and_owned_inclusions','real catalog RPC / canonical FAQ component',async()=>{
 const data={title:'VERIFY ticket title',slug:'verify-catalog-ticket',type:'van_tour',status:'published',meta_title:'VERIFY catalog SEO',meta_description:'VERIFY catalog description',og_image:'https://example.invalid/catalog-og.webp',og_image_alt:'VERIFY catalog image alt',inclusions:'VERIFY canonical inclusions'};
 const id=(await db.query("select save_catalog_v1($1,$2,'product',null,$3,false) id",[op,actors.owner,data])).rows[0].id;
 const saved=(await db.query('select * from products where id=$1',[id])).rows[0];assert.equal(saved.title,data.title);assert.equal(saved.inclusions,data.inclusions);
 const faq={...c,'faq.items':JSON.stringify([{id:'90000000-0000-4000-8000-000000000098',question:'VERIFY inclusions?',answer:'UNUSED',answerSource:'product-inclusions',active:true}])};
 assert.ok(renderConsumer('faq.items',faq,{inclusions:saved.inclusions}).html.includes(saved.inclusions));
 });
 await check('entities.catalog.retirement_compatibility','active editor inventory + real old/current RPC saves + Website SEO',async()=>{
  assertCatalogRetirement();
  const base={title:'Legacy catalog',slug:'verify-legacy-retirement',type:'van_tour',status:'published',inclusions:'Retained inclusions'};
  const old={meta_title:'VERIFY old title',meta_description:'VERIFY old email copy',og_image:'https://example.invalid/old.webp',og_image_alt:'VERIFY old alt'};
  const save=async(data,id=null)=>(await db.query("select save_catalog_v1($1,$2,'product',$3,$4,false) id",[op,actors.owner,id,data])).rows[0].id;
  const id=await save({...base,...old});await save({...base,title:'Current editor title'},id);
  const saved=(await db.query('select * from products where id=$1',[id])).rows[0];
  for(const key of retainedCatalogPresentationKeys)assert.equal(saved[key],old[key],key);
  const fresh=await save({...base,slug:'verify-without-legacy'});const next=(await db.query('select * from products where id=$1',[fresh])).rows[0];assert.equal(next.status,'published');for(const key of retainedCatalogPresentationKeys)assert.equal(next[key],null);
  const metadata=renderConsumer('bookPage.seoTitle',c,{home:{...homeData(),product:saved}});assert.equal(metadata.metadata.title,c['bookPage.seoTitle']);for(const value of Object.values(old))assert.ok(!JSON.stringify(metadata).includes(value));
  for(const role of ['content_editor','operations'])await assert.rejects(db.query("select save_catalog_v1($1,$2,'product',$3,$4,false)",[op,actors[role],id,base]),e=>e.code==='42501');
  for(const key of retainedCatalogPresentationKeys)catalogCompatibility.push({field:'catalog.product.'+key,owner:'Historical Catalog data',classification:'Retired Catalog compatibility',connectivity:'Retained; absent from active editor',status:'PASS',consumer:key==='meta_description'?'Existing historical email description consumer retained':'No active public presentation owner',method:'old-client save → current-form omission → fresh SQL read; new publication without retired fields; active inventory absence',evidence:'entities.catalog.retirement_compatibility',lifecycle:{historicalSave:'PASS',currentSavePreserves:'PASS',publicationWithoutLegacy:'PASS',activeEditorAbsence:'PASS',publicSEOOwnership:'PASS'},limitations:['Compatibility PASS only; not a claim that retired Catalog properties render as public SEO.']});
 });
 await tracked('calendar_pricing.permission_boundary','existing pricing RPC authorization',async()=>{
 const product='10000000-0000-4000-8000-000000000020';for(const role of ['operations','content_editor'])await assert.rejects(db.query('select save_passenger_pricing_v1($1,$2,$3,$4,now())',[op,actors[role],product,{}]),e=>e.code==='42501');
 // Positive owner commercial flows are covered by the existing calendar regression suite, not this negative probe.
 });
 await tracked('meeting_point.append_only_owner_versions','meeting_point_versions SQL',async()=>{
 const next={...meetingPoint,name:'VERIFY future boarding',directions:'VERIFY directions'};
 for(const role of ['admin','content_editor','operations'])await assert.rejects(db.query('select save_meeting_point_v1($1,$2,$3,$4,null)',[op,actors[role],next,'2030-06-01T07:00:00Z']),e=>e.code==='42501');
 await db.query('select save_meeting_point_v1($1,$2,$3,$4,null)',[op,actors.owner,next,'2030-06-01T07:00:00Z']);
 const rows=(await db.query('select * from meeting_point_versions where operator_id=$1 order by effective_at',[op])).rows;assert.ok(rows.some(r=>JSON.stringify(r).includes(next.name)));const snapshot=structuredClone(rows);
 assert.deepEqual((await db.query('select * from meeting_point_versions where operator_id=$1 order by effective_at',[op])).rows,snapshot);
 const latest=rows.at(-1);await db.query('select save_meeting_point_v1($1,$2,$3,$4,$5)',[op,actors.owner,{...next,name:'VERIFY later boarding'},'2030-06-01T08:00:00Z',latest.id]);
 const appended=(await db.query('select * from meeting_point_versions where operator_id=$1 order by effective_at',[op])).rows;assert.equal(appended.length,snapshot.length+1);assert.deepEqual(appended.slice(0,-1),snapshot);
 await assert.rejects(db.query('select save_meeting_point_v1($1,$2,$3,$4,$5)',[op,actors.owner,next,'2030-06-01T09:00:00Z',latest.id]),e=>e.code==='PT409');
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_table_privilege($1,'meeting_point_versions','insert') ok",[role])).rows[0].ok,false);
 });
}
