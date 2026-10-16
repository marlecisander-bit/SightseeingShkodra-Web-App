import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {adminSections} from '../../src/modules/identity/admin-navigation.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {OverviewPanel}=await import('../../src/app/admin/overview-panel.tsx');
const {AmenitiesInput}=await import('../../src/app/admin/hero-amenities-input.tsx');
for(const role of ['owner','admin','content_editor'])test(`${role} Overview retains Partners description and places it after Website`,()=>{
 const html=renderToStaticMarkup(React.createElement(OverviewPanel,{operatorId:'synthetic',role}));
 assert.ok(html.includes(adminSections.find(s=>s.slug==='partners').description));
 assert.ok(html.indexOf('/synthetic/partners')>html.indexOf('/synthetic/content'));
});
test('operations Overview does not gain editorial access',()=>{
 const html=renderToStaticMarkup(React.createElement(OverviewPanel,{operatorId:'synthetic',role:'operations'}));
 assert.ok(!html.includes('/synthetic/partners'));
});
test('amenity Description control is absent while submitted historical value survives',()=>{
 const rows=[{id:'00000000-0000-4000-8000-000000000001',title:'Audio Guide',icon:'headphones',description:'Historical saved description',display_order:1,published:true,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'}];
 const html=renderToStaticMarkup(React.createElement(AmenitiesInput,{value:JSON.stringify(rows),onChange:()=>{}}));
 assert.ok(!html.includes('<label>Description'));assert.ok(html.includes('Historical saved description'));assert.ok(html.includes('name="hero.amenities"'));assert.ok(html.includes('Amenity 1 title'));
});
