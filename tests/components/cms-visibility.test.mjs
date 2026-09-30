import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestDatabase, loadDevelopmentFixtures } from '../helpers/database.mjs';
import { initialWebsiteContent, sectionVisible, visibleWebsiteLink, unavailableWebsiteContent } from '../../src/modules/content/website-schema.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const { Footer } = await import('../../src/components/public/ui.tsx');
const { BookingProvider } = await import('../../src/components/public/booking.tsx');
const { TourView, LiveView } = await import('../../src/components/public/editorial-pages.tsx');
const { HomepageView } = await import('../../src/components/public/homepage-view.tsx');
const h=React.createElement;
const render=child=>renderToStaticMarkup(h(BookingProvider,null,child));
const routes=['/','/tour','/explore','/explore/lake','/live','/your-day','/credits'];
const home={state:'empty',product:null,content:{},date:null,timezone:null,price:'',frequency:'Unavailable',departures:[],schedule:'empty',adultFares:[]};
const reviews={reviews:[{id:'review-1',author:'Fixture guest',rating:5,body:'A published fixture review.',source:'Direct',review_date:null,original_url:null,avatar_url:null,language:null,featured:false,published:true,display_order:0,updated_at:''}],settings:{display_limit:3,google_reviews_url:null,leave_review_url:null}};

test('published CMS enable-disable-enable and edited fields reach every shared footer without a hidden wrapper or image',async()=>{
 const db=await createTestDatabase();try{
 await loadDevelopmentFixtures(db);const op='10000000-0000-4000-8000-000000000001';
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'content_editor') returning id",[op,uid])).rows[0].id;
 const row=async()=>(await db.query("select * from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
 const save=async(c,action)=>db.query('select save_website_content_v1($1,$2,$3,$4,$5)',[op,actor,JSON.stringify(c),(await row())?.updated_at??null,action]);
 const c={...initialWebsiteContent,'final.eyebrow':'Shared invitation marker','final.title':'Edited title','final.emphasis':'Edited emphasis','final.book':'Choose this day','final.image':'/images/bridge-view.webp','final.alt':'Edited invitation image'};
 await save(c,'initialize');
 for(const visible of [true,false,true]){
 c['final.showOnHomepage']=String(visible);await save(c,'draft');
 const previous=(await row()).published_body;assert.ok(previous);
 await save(c,'publish');const published=(await row()).published_body.content;
 if(process.env.CMS_VISIBILITY_EVIDENCE){mkdirSync('private/cms-visibility',{recursive:true});const css=['src/app/brand-tokens.css','src/app/globals.css','src/app/(public)/public.css'].filter(p=>{try{readFileSync(p);return true;}catch{return false;}}).map(p=>readFileSync(p,'utf8')).join('\n');writeFileSync('private/cms-visibility/'+(visible?'enabled':'disabled')+'.html','<!doctype html><html><head><base href="http://localhost:3000/"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><nav><a href="http://localhost:3002/enabled.html">Enabled</a> <a href="http://localhost:3002/disabled.html">Disabled</a></nav>'+routes.map(pathname=>'<article data-route="'+pathname+'"><p>Preceding content '+pathname+'</p><div class="public-site">'+render(h(Footer,{content:published,previewPathname:pathname}))+'</div></article>').join('')+'</body></html>');}
 for(const pathname of routes){const html=render(h(Footer,{content:published,previewPathname:pathname}));assert.equal(html.includes('p-footer-cta'),visible,pathname);assert.equal(html.includes('Shared invitation marker'),visible,pathname);assert.equal(html.includes('Edited invitation image'),visible,pathname);assert.ok(html.includes('p-footer-info'));
 if(visible){for(const value of ['Edited title','Edited emphasis','Choose this day','bridge-view.webp'])assert.ok(html.includes(value),value);assert.match(html,/href="\/book"/);assert.match(html,/aria-haspopup="dialog"/);}}
 }
 for(const pathname of ['/book','/booking/example']){const html=render(h(Footer,{content:c,previewPathname:pathname}));assert.ok(!html.includes('p-footer-cta'));assert.ok(!html.includes('Edited invitation image'));}
 }finally{await db.close();}
});
test('shared section flags remove secondary Tour and Live consumers but preserve independent map and booking',()=>{
 const enabled=render(h(TourView,{tour:home,c:initialWebsiteContent,reviews,places:[]}));for(const id of ['tour-route','tour-live','timetable','reviews'])assert.ok(enabled.includes('id="'+id+'"'));
 const c={...initialWebsiteContent,...Object.fromEntries(['route','live','departures','reviews'].map(id=>[id+'.showOnHomepage','false']))};
 const tour=render(h(TourView,{tour:home,c,reviews,places:[]}));
 for(const id of ['tour-route','tour-live','timetable','reviews'])assert.ok(!tour.includes('id="'+id+'"'));
 assert.ok(tour.includes('id="faq"'));assert.ok(tour.includes('Book your day'));
 const live=render(h(LiveView,{c,places:[]}));assert.ok(live.includes('<h1>Live map</h1>'));assert.ok(live.includes('<iframe'));assert.ok(!live.includes(c['route.title']));assert.ok(!live.includes(c['live.title']));
 const homepage=render(h(HomepageView,{home,content:c,reviews,places:[]}));assert.ok(!homepage.includes('id="route"'));
});
test('unavailable publication never restores visible defaults, and optional anchors follow their sections',()=>{
 const c=unavailableWebsiteContent();for(const id of ['hero','intro','route','live','departures','reviews','notebook','final'])assert.equal(sectionVisible(c,id),false);
 assert.equal(visibleWebsiteLink('/#route',c),false);assert.equal(visibleWebsiteLink('/tour#timetable',c),false);
 for(const link of ['/tour','/live','/explore','/tour#faq'])assert.equal(visibleWebsiteLink(link,c),true);
 assert.equal(sectionVisible({...initialWebsiteContent,'final.showOnHomepage':'false'},'final'),false);
});

test('unified journey shares visibility flags while preserving one map and booking entry',async()=>{
 const {RouteJourney}=await import('../../src/components/public/route-journey.tsx');
 const initial={date:'2026-09-30',title:'Today',times:[],fares:[],stops:[{id:'stop-1',label:'Stop 1 - Start'}]};
 for(const visible of [true,false,true]){
 const content={...initialWebsiteContent,'route.showOnHomepage':String(visible),'departures.showOnHomepage':String(visible),'live.showOnHomepage':'false'};
 const html=render(h(RouteJourney,{content,initial,places:[]}));
 assert.equal((html.match(/<iframe/g)||[]).length,1);
 assert.equal(html.includes('id="journey-title"'),visible);
 assert.equal(html.includes('id="journey-departures"'),visible);
 assert.ok(html.includes('Book your day'));
 }
});
