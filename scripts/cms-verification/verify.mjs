import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {assertLocalEnvironment,denyNetwork} from './safety.mjs';
import {preparedContent,fixtureValue,marker} from './fixtures.mjs';
import {checkField,publicMarkerPresent} from './assertions.mjs';
import {editableWebsiteSections,websiteFields,initialWebsiteContent,validateWebsiteContent} from '../../src/modules/content/website-schema.ts';
import {publicNavigation} from '../../src/modules/content/navigation.ts';
import {createTestDatabase,loadDevelopmentFixtures} from '../../tests/helpers/database.mjs';
import {renderConsumer} from './render.mjs';
import {renderYourDay} from './request-route.mjs';
import {clientKeys,renderClientProbe} from './client.mjs';
import {verifyEntities} from './entities.mjs';
const op='10000000-0000-4000-8000-000000000001';
const ownerOnly=new Set(['footer','whatsapp','legalprivacy','legalterms']);
const historical=JSON.parse(await readFile(new URL('../../tests/helpers/cms-verification/audit-reference.json',import.meta.url),'utf8'));
const declared=JSON.parse(await readFile(new URL('./cases.json',import.meta.url),'utf8')).keys;
export function assertDeclaredCases(fields){assert.deepEqual([...fields.map(f=>f.key)].sort(),[...declared].sort(),'active fields differ from explicit public probe cases; review additions/removals');}
const knownPartial=new Set(['hero.desktopPosition','nav.0.label','nav.0.link','nav.3.label','nav.3.link']);
export function summarize(rows){return Object.fromEntries(['PASS','FAIL','UNTESTED'].map(status=>[status,rows.filter(r=>r.status===status).length]));}
async function projection(field,c){const p=clientKeys.has(field.key)?await renderClientProbe(field.key,c):['route.eyebrow','route.title'].includes(field.key)?await renderYourDay(c):renderConsumer(field.key,c);return {...p,visibilityMarker:c['live.eyebrow'],legalMarker:c['legal.'+field.key.split('.')[1]+'.text'],message:c['whatsapp.message'],phone:c['whatsapp.number']};}
export async function verifyCms({write=false}={}){
 assertLocalEnvironment();const restoreNetwork=denyNetwork();
 const git=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const active=editableWebsiteSections.flatMap(s=>s.fields.map(field=>({...field,section:s.id,owner:s.title})));
 assert.equal(new Set(active.map(f=>f.key)).size,active.length,'duplicate active field definition');assertDeclaredCases(active);
 const db=await createTestDatabase({now:'2030-06-01T06:00:00Z'}),actors={},fields=[],checks=[],catalogCompatibility=[];
 const check=async(name,method,fn)=>{try{await fn();checks.push({name,status:'PASS',method});}catch(error){checks.push({name,status:'FAIL',method,error:error.message});}};
 const read=async()=>(await db.query("select *,updated_at::text stamp from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
 const save=async(c,operation,role='owner',stamp)=>db.query('select save_website_content_v1($1,$2,$3,$4,$5)',[op,actors[role],structuredClone(c),stamp===undefined?(await read())?.stamp??null:stamp,operation]);
 try{
  await loadDevelopmentFixtures(db);
  for(const role of ['owner','admin','content_editor','operations']){const uid=randomUUID();await db.query('insert into auth.users values($1)',[uid]);actors[role]=(await db.query('insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,$3) returning id',[op,uid,role])).rows[0].id;}
  await check('roles.editor_cannot_initialize','real Website RPC / SQLSTATE',async()=>assert.rejects(save(initialWebsiteContent,'initialize','content_editor',null),e=>e.code==='42501'));
  await save(initialWebsiteContent,'initialize');
  await check('roles.owner_initializes','real Website RPC / persisted publication',async()=>assert.deepEqual((await read()).published_body.content,initialWebsiteContent));
  for(const field of active){
   const row={field:field.key,owner:field.owner,section:field.section,kind:field.kind,classification:'active structured control',connectivity:knownPartial.has(field.key)?'Partial':'Connected',structuralEvidence:'current schema + explicit real-component/metadata probe',status:'UNTESTED',method:clientKeys.has(field.key)?'disposable SQL lifecycle + actual client open/close DOM interaction':['route.eyebrow','route.title'].includes(field.key)?'disposable SQL lifecycle + actual YourDay request composition with synthetic loaders':'disposable SQL lifecycle + isolated server-rendered public consumer',lifecycle:{},evidence:'scripts/cms-verification/verify.mjs + render.mjs',limitations:[]};
   let stage='fixture';
   try{
    const base=preparedContent(field.key);let value=fixtureValue(field);
    if(value===base[field.key]&&field.kind==='image')value=value.includes('castle')?'/images/lake.webp':'/images/castle.webp';
    assert.notEqual(value,base[field.key],'fixture must differ from saved baseline');
    row.fixture={id:'field:'+field.key,value};row.publicProperty=field.kind==='image'?'img/source src/srcset':field.kind==='position'?'hero CSS custom property':field.kind==='link'||field.kind==='external'||field.kind==='destination'?'anchor href':field.key.includes('seo')?'metadata property':'rendered text or explicit conditional DOM';
    const changed=validateWebsiteContent({...base,[field.key]:value});
    stage='initializeBaseline';await save(base,'publish');row.lifecycle.initializeBaseline='PASS';
    const before=await projection(field,(await read()).published_body.content);
    row.consumer=before.consumer;row.route=before.route;
    const writer=ownerOnly.has(field.section)?'owner':'content_editor';
    row.roles={draft:writer,publisher:ownerOnly.has(field.section)?'owner':'admin'};
    stage='draftSave';await save(changed,'draft',writer);row.lifecycle.draftSave='PASS';
    stage='freshRead';await db.exec('set role service_role');const fresh=await read();await db.exec('reset role');assert.equal(fresh.body.content[field.key],value);assert.deepEqual(fresh.published_body.content,base);row.lifecycle.freshRead='PASS';
    stage='publicBeforePublication';assert.deepEqual(await projection(field,fresh.published_body.content),before);row.lifecycle.publicBeforePublication='PASS';
    stage='savedDraftPreview';const preview=await projection(field,fresh.body.content),proof=checkField(field,value,preview);row.lifecycle.savedDraftPreview=proof.status;
    stage='publish';await save(fresh.body.content,'publish',row.roles.publisher);row.lifecycle.publish='PASS';
    stage='repeatedRead';const first=(await read()).published_body.content,second=(await read()).published_body.content;assert.deepEqual(first,changed);assert.deepEqual(second,first);row.lifecycle.repeatedRead='PASS';
    stage='publicAfterPublication';const rendered=await projection(field,first),outcome=checkField(field,value,rendered);assert.deepEqual(rendered,await projection(field,second));row.lifecycle.publicAfterPublication=outcome.status;row.status=outcome.status;
    if(outcome.status==='PASS'){assert.notDeepEqual(before,rendered,'public probe must change, not merely find an existing marker');if(proof.status!=='PASS')throw Error('saved-draft preview did not match published consumer');}
    if(outcome.limitation)row.limitations.push(outcome.limitation);
    if(/^nav\.[03]\./.test(field.key))row.limitations.push('Duplicate normalized targets are suppressed; label probe uses an explicit unique-target precondition. Separate default suppression check is recorded.');
    if(field.kind==='image')row.limitations.push('Image URL binding only; no remote fetch, visual crop or binary upload proof.');
    if(field.kind==='visibility'||field.kind==='toggle'||field.kind==='publication')row.limitations.push('Conditional DOM/projection proof; not physical-device CSS or interaction proof.');
   }catch(error){await db.exec('reset role');row.status='FAIL';row.lifecycle[stage]='FAIL';row.error=error.message;}
   fields.push(row);
  }
  await save(preparedContent(),'publish');
  await check('roles.editor_draft_publisher_publish','real RPC / fresh queries',async()=>{const c={...preparedContent(),'hero.title':'Permission proof'};await save(c,'draft','content_editor');await assert.rejects(save(c,'publish','content_editor'),e=>e.code==='42501');await assert.rejects(save(c,'draft','operations'),e=>e.code==='42501');await save(c,'publish','admin');assert.equal((await read()).published_body.content['hero.title'],'Permission proof');});
  await check('roles.owner_only_settings','real RPC / editor and admin rejection',async()=>{const c={...(await read()).body.content,'whatsapp.message':'Owner sensitive proof'};await assert.rejects(save(c,'draft','content_editor'),e=>e.code==='42501');await save(c,'draft','owner');await assert.rejects(save(c,'publish','admin'),e=>e.code==='42501');await save(c,'publish','owner');});
  await check('roles.unauthenticated_write_denied','anon SQL role / RPC grant',async()=>{await db.exec('set role anon');try{await assert.rejects(save(initialWebsiteContent,'draft','owner',null),e=>e.code==='42501');}finally{await db.exec('reset role');}});
  await check('roles.cross_operator_denied','real RPC / actor-operator mismatch',async()=>assert.rejects(db.query("select save_website_content_v1('20000000-0000-4000-8000-000000000001',$1,$2,null,'draft')",[actors.owner,initialWebsiteContent]),e=>e.code==='42501'));
  await check('roles.stale_document_denied','real RPC / optimistic stamp',async()=>{const old=(await read()).stamp;await save(preparedContent(),'draft','owner');await assert.rejects(save(preparedContent(),'draft','owner',old),e=>e.code==='PT409');});
  const activeKeys=new Set(active.map(f=>f.key)),retained=websiteFields.filter(f=>!activeKeys.has(f.key));
  const old=preparedContent();for(const f of retained)old[f.key]=fixtureValue(f);
  await check('compatibility.historical_values_roundtrip','current SQL save + application validator',async()=>{validateWebsiteContent(old);await save(old,'publish');const value=(await read()).published_body.content;for(const f of retained)assert.equal(value[f.key],old[f.key],f.key);});
  await check('compatibility.additive_old_document','remove additive partner fields / SQL and app validation',async()=>{const old={...initialWebsiteContent};for(const k of Object.keys(old))if(k.startsWith('partners.'))delete old[k];assert.equal(validateWebsiteContent(old)['partners.ctaEnabled'],'false');assert.equal((await db.query('select validate_website_content_v1($1) valid',[old])).rows[0].valid,true);});
  await check('navigation.default_duplicate_suppression','actual publicNavigation projection',async()=>{const c={...initialWebsiteContent,'nav.0.label':'SUPPRESSED_ZERO','nav.3.label':'SUPPRESSED_THREE'};const links=publicNavigation(c);assert.ok(!links.some(l=>/SUPPRESSED/.test(l.label)));assert.equal(new Set(links.map(l=>l.href)).size,links.length);});
  await check('visibility.mandatory_route_map','actual RouteJourney when optional flags off',async()=>{const p=renderConsumer('routePage.title',{...preparedContent(),'route.showOnHomepage':'false','live.showOnHomepage':'false','departures.showOnHomepage':'false'});assert.ok(p.html.includes('<iframe'));assert.ok(!p.html.includes('id="journey-title"'));});
  await check('retirement.hero_amenities_never_render','real HomepageView with retained legacy values',async()=>{const c=preparedContent();assert.ok(!renderConsumer('hero.amenities',c).html.includes('BASE amenity'));assert.ok(!renderConsumer('hero.amenities',{...c,'hero.amenities':'[]'}).html.includes('Audio Guide'));assert.ok(!active.some(f=>f.key==='hero.amenities'));});
  await check('faq.inclusions_and_inactive','real FaqPage / negative text markers',async()=>{const c=preparedContent();const a=JSON.parse(c['faq.items'])[0];const html=renderConsumer('faq.items',{...c,'faq.items':JSON.stringify([{...a,answerSource:'product-inclusions',answer:'MUST_NOT_RENDER'},{...a,id:'hidden',active:false,question:'HIDDEN_QUESTION'}])}).html;assert.ok(html.includes('Synthetic product inclusions'));assert.ok(!html.includes('MUST_NOT_RENDER'));assert.ok(!html.includes('HIDDEN_QUESTION'));});
  await check('self_test.deliberately_disconnected_control','isolated fixture projection drops marker',async()=>{const field=active.find(f=>f.key==='hero.book');const c=preparedContent(),value=fixtureValue(field);assert.equal(checkField(field,value,await projection(field,{...c,[field.key]:value})).status,'PASS');assert.equal(checkField(field,value,await projection(field,c)).status,'FAIL');assert.equal(publicMarkerPresent('<script>'+marker(field.key)+'</script><input type="hidden" value="'+marker(field.key)+'">',field.key),false);});
  await verifyEntities({db,actors,fields,check,catalogCompatibility});
  const compatibility=retained.map(f=>({field:f.key,owner:'Retained Website document schema',classification:'Compatibility',connectivity:'Retained; not an active editor',consumer:null,method:'full-document SQL round-trip',status:checks.find(c=>c.name==='compatibility.historical_values_roundtrip').status,evidence:'compatibility.historical_values_roundtrip',limitations:['Stored-value compatibility only; no public rendering claim.']}));
  const code=historical.rows.filter(r=>r.connection==='Code').map(r=>({field:r.field,owner:r.owner,classification:'Code-controlled',connectivity:'Historical protected-source inventory',consumer:r.route,status:'UNTESTED',method:'historical matrix reference only',evidence:r.evidence,limitations:['Not an editable CMS control; no new algorithm or security certification.']}));
  const toolingFiles=['scripts/verify-cms-fields.mjs','scripts/cms-verification/verify.mjs','scripts/cms-verification/assertions.mjs','scripts/cms-verification/render.mjs','scripts/cms-verification/fixtures.mjs','scripts/cms-verification/entities.mjs','scripts/cms-verification/safety.mjs','scripts/cms-verification/cases.json','scripts/cms-verification/client.mjs','scripts/cms-verification/request-route.mjs','scripts/cms-verification/request-website.mjs','scripts/cms-verification/request-destinations.mjs','src/modules/content/catalog-fields.ts','supabase/migrations/20261016000100_catalog_presentation_retirement.sql'];const toolingHashes=Object.fromEntries(await Promise.all(toolingFiles.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
  const result={toolingHashes,generatedAt:new Date().toISOString(),baseline:git,schemaFingerprint:createHash('sha256').update(JSON.stringify(websiteFields)).digest('hex'),safety:{database:'disposable in-memory PGlite with existing migrations',network:'fetch denied',hostedWrites:false},counts:{active:active.length,retained:compatibility.length,codeControlled:code.length,catalogCompatibility:summarize(catalogCompatibility),fields:summarize(fields),activeFields:summarize(fields.filter(f=>f.classification==='active structured control')),checks:summarize(checks)},fields,compatibility,catalogCompatibility,codeControlled:code,checks,limitations:['Server SSR plus isolated client DOM interactions and synthetic request loaders; not authenticated hosted browser edit/save testing.','Direct entity saves use existing service database model; server-action permissions additionally covered by existing identity/integration regressions.','Four Catalog presentation controls are retired; their compatibility evidence is separate from active public rendering.']};
  if(write){await mkdir('docs',{recursive:true});await writeFile('docs/CMS-F10-FIELD-RESULTS.json',JSON.stringify(result,null,2)+'\n');await writeFile('docs/CMS-F10-VERIFICATION-RESULT.md',humanReport(result));}
  return result;
 }finally{restoreNetwork();await db.close();}
}
function humanReport(r){return `# F10 CMS verification result\n\nGenerated ${r.generatedAt}. Baseline \`${r.baseline}\`. Local disposable data only.\n\nActive controls: ${r.counts.active}; retained keys: ${r.counts.retained}; historical protected code entries: ${r.counts.codeControlled}. Structural connectivity is separate from behavioral status.\n\nBehavioral fields/entities: ${JSON.stringify(r.counts.fields)}. Active-control behavior: ${JSON.stringify(r.counts.activeFields)}. Independent safety/role/entity checks: ${JSON.stringify(r.counts.checks)}.\n\n| Field | Owner | Consumer | Connectivity | Status | Limits / failure |\n|---|---|---|---|---|---|\n${r.fields.map(f=>`| ${f.field} | ${f.owner} | ${f.consumer??'Not established'} | ${f.connectivity} | ${f.status} | ${(f.error??f.limitations?.join(' ' )??'').replaceAll('|','/')} |`).join('\n')}\n\n## Retired Catalog compatibility (not public rendering)\n\n${r.catalogCompatibility.map(f=>`- ${f.status}: ${f.field} — ${f.limitations.join(' ')}`).join('\n')}\n\n## Independent checks\n\n${r.checks.map(c=>`- ${c.status}: ${c.name} — ${c.error??c.method}`).join('\n')}\n\n## Interpretation\n\nFAIL is a detected connection/assertion failure; UNTESTED is never counted as PASS. See machine-readable lifecycle stages and evidence per row. Compatibility PASS means stored data survived, not that dormant keys have public consumers. Code-controlled entries remain behaviorally UNTESTED. The ${r.counts.active} active Website controls are not a count of every Destination/Partner/Review/Calendar subfield; entity cases are representative lifecycle and boundary probes, not exhaustive per-property certification. No external map, provider, hosted API, credentials or public browser route was used. Client probes open and close actual dialogs in a simulated DOM; request probes render the actual Your Day page with synthetic loaders. Neither establishes physical-device visibility, actual authenticated sessions or hosted persistence. Historical 134-field artifacts remain untouched.\n`;}
