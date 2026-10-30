import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {adminNavigationGroups} from '../../src/modules/identity/admin-navigation-layout.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {OverviewPanel}=await import('../../src/app/admin/overview-panel.tsx');
const {editableWebsiteSections,validateWebsiteContent,initialWebsiteContent}=await import('../../src/modules/content/website-schema.ts');
for(const role of ['owner','admin','content_editor'])test(`${role} Website navigation retains the canonical Partners destination`,()=>{
 const html=renderToStaticMarkup(React.createElement(OverviewPanel,{operatorId:'synthetic',role}));
 if(role==='content_editor')assert.ok(html.includes('/synthetic/content'));
 const website=adminNavigationGroups('synthetic',role).find(group=>group.id==='website');
 assert.ok(website.items.find(item=>item.id==='content').href.startsWith('/admin/synthetic/content'));
 assert.ok(website.items.find(item=>item.id==='partners').href.endsWith('/partners'));
 assert.ok(website.items.findIndex(item=>item.id==='partners')>website.items.findIndex(item=>item.id==='content'));
});
test('operations Overview does not gain editorial access',()=>{
 const html=renderToStaticMarkup(React.createElement(OverviewPanel,{operatorId:'synthetic',role:'operations'}));
 assert.ok(!html.includes('/synthetic/partners'));
});
test('hero amenities have no active Website editor and legacy values remain compatible',()=>{
 const content={...initialWebsiteContent,'hero.amenities':'[]'};assert.ok(!editableWebsiteSections.some(s=>s.id==='heroAmenities'));assert.ok(!editableWebsiteSections.flatMap(s=>s.fields).some(f=>f.key==='hero.amenities'));assert.equal(validateWebsiteContent(content)['hero.amenities'],'[]');
});
