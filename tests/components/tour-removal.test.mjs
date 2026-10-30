import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent,editableWebsiteSections,websiteEditorGroups,resolveWebsiteLink,validateWebsiteContent} from '../../src/modules/content/website-schema.ts';
import {publicNavigation} from '../../src/modules/content/navigation.ts';
import {emptyHomepage} from '../../src/modules/content/homepage.ts';
import {GET} from '../../src/app/(public)/tour/route.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {BookingProvider,Header}=await import('../../src/components/public/booking.tsx');
const {Footer}=await import('../../src/components/public/ui.tsx');
const {HomepageView}=await import('../../src/components/public/homepage-view.tsx');
const {PathnameContext}=await import('next/dist/shared/lib/hooks-client-context.shared-runtime.js');
const h=React.createElement;
test('retired Tour is a fixed 301 redirect and drops obsolete and untrusted queries',()=>{
 assert.equal(existsSync('src/app/(public)/tour/page.tsx'),false);
 for(const query of ['', '?utm_source=old', '?next=https://example.invalid&token=secret']){
  const response=GET(new Request('https://sightseeingshkodra.app/tour'+query));
  assert.equal(response.status,301);assert.equal(response.headers.get('location'),'/route');
 }
});
test('historical navigation removes the Tour entry and preserves Route, FAQ and booking',()=>{
 const c={...initialWebsiteContent,'nav.0.link':'/tour','nav.0.label':'Tour','nav.4.link':'/tour#faq','footer.0.link':'/tour'};
 const before=JSON.stringify(c);
 const items=publicNavigation(c);
 assert.ok(!items.some(i=>i.href.startsWith('/tour')||i.label==='Tour'));
 for(const href of ['/','/route','/faq','/explore'])assert.ok(items.some(i=>i.href===href));
 assert.equal(resolveWebsiteLink('/tour#faq'),'/faq');assert.equal(resolveWebsiteLink('/tour#timetable'),'/route');assert.equal(resolveWebsiteLink('/tour#included'),'/book');
 assert.equal(resolveWebsiteLink('/book'),'/book');assert.equal(resolveWebsiteLink('/tourist'),'/tourist');
 validateWebsiteContent(c);assert.equal(JSON.stringify(c),before);
 const html=renderToStaticMarkup(h(PathnameContext.Provider,{value:'/'},h(BookingProvider,{content:c,preview:true},h(Header,{content:c}),h(Footer,{content:c,previewPathname:'/'}))));
 assert.ok(!html.includes('href="/tour'));assert.ok(!html.includes('>Tour<'));assert.ok(html.includes('Book your day'));
});
test('Tour and retired homepage promotion controls are absent while FAQ retains its owner',()=>{
 assert.ok(!websiteEditorGroups.pages.some(s=>s.id==='tourPage'||s.id==='how'));
 const fields=editableWebsiteSections.flatMap(s=>s.fields);
 for(const key of ['tourPage.eyebrow','labels.tour','how.title'])assert.ok(!fields.some(f=>f.key===key));
 assert.equal(fields.filter(f=>f.key==='tourPage.includedTitle').length,0);
 assert.ok('tourPage.includedTitle' in initialWebsiteContent);
 assert.ok(!websiteEditorGroups.homepage.some(s=>s.id==='intro'));
 assert.ok(websiteEditorGroups.pages.find(s=>s.id==='faq').fields.some(f=>f.key==='tourPage.faqTitle'));
 assert.ok('tourPage.eyebrow' in initialWebsiteContent);assert.ok('how.title' in initialWebsiteContent);
});
test('homepage omits retired ticket inclusions and service panel while retaining booking destinations',()=>{
 const home={...emptyHomepage('ready'),product:{id:'fixture',slug:'fixture',title:'Synthetic ticket',description:'Shared product description',inclusions:'Shared inclusions',stops:[]}};
 const c={...initialWebsiteContent,'tourPage.includedTitle':'Saved inclusion heading','notebook.showOnHomepage':'false'};
 const html=renderToStaticMarkup(h(BookingProvider,{preview:true},h(HomepageView,{home,content:c,places:[],planner:{date:'2030-01-01',times:[],fares:[],stops:[]}})));
 assert.ok(!html.includes('href="/tour'));assert.ok(!html.includes('href="/route#journey-departures"'));assert.ok(html.includes('/book?productId='));assert.equal(html.includes('Saved inclusion heading'),false);assert.equal(html.includes('Shared inclusions'),false);
});
