import assert from 'node:assert/strict';
import {test} from 'node:test';
import {adminNavigationGroups,activeAdminItem,adminContext,websiteNavigationContext,adminAreaLabels} from '../../src/modules/identity/admin-navigation-layout.ts';
import {navigationFor} from '../../src/modules/identity/admin-navigation.ts';
for(const role of ['owner','admin','operations','content_editor'])test(`${role}: all existing sections preserved with no new capabilities`,()=>{
 const groups=adminNavigationGroups('operator-fixture',role),items=groups.flatMap(g=>g.items);
 assert.deepEqual([...new Set(items.flatMap(i=>i.section?[i.section]:[]))].sort(),navigationFor(role).map(i=>i.slug).sort());
 assert.equal(new Set(items.map(i=>i.href)).size,items.length,'context destinations must be unique');
 assert.ok(items.every(i=>!i.section||i.href.startsWith('/admin/operator-fixture/'+i.section)));
 assert.equal(items.some(i=>i.id==='products'),true);
 assert.equal(items.some(i=>i.id==='business'),role==='owner');
 assert.equal(items.some(i=>i.id==='email'),role==='owner');
 assert.equal(items.some(i=>i.id==='map-admin'),role!=='content_editor');
 assert.ok(!groups.some(g=>g.id==='reports'));
});
test('six approved areas, canonical external map and active contextual views',()=>{
 assert.equal(Object.keys(adminAreaLabels).length,6);
 const g=adminNavigationGroups('fixture','owner');
 assert.equal(activeAdminItem(g,'products','').id,'products');
 assert.equal(activeAdminItem(g,'departures','availability').id,'availability');
 assert.equal(activeAdminItem(g,'content','faq').id,'faq');
 assert.equal(activeAdminItem(g,'content','').id,'content');
 assert.equal(g.flatMap(g=>g.items).find(i=>i.id==='map-admin').href,'https://sightseeingshkodralivetrackingapp.netlify.app/');
 assert.equal(adminContext('#admin-panel:website-section=hero'),'');
 assert.equal(adminContext('#admin-nav=prices'),'prices');
 assert.deepEqual(websiteNavigationContext('faq'),{scope:'pages',section:'faq'});
 assert.deepEqual(websiteNavigationContext('destinations'),{scope:'destinations',section:null});
});

test('supplier management belongs with Products and keeps its original permissions and route',()=>{
 for(const role of ['owner','admin','operations','content_editor']){
  const groups=adminNavigationGroups('fixture',role),supplier=groups.flatMap(g=>g.items).find(i=>i.id==='catalog');
  if(supplier){assert.equal(groups.find(g=>g.items.includes(supplier)).id,'products');assert.equal(supplier.href,'/admin/fixture/catalog');}
  assert.equal(groups.find(g=>g.id==='more')?.items.some(i=>i.id==='catalog'),false);
 }
});
