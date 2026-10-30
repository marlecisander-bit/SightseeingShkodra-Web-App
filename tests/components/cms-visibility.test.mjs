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
const { LiveView } = await import('../../src/components/public/editorial-pages.tsx');
const { HomepageView } = await import('../../src/components/public/homepage-view.tsx');
const h=React.createElement;
const render=child=>renderToStaticMarkup(h(BookingProvider,null,child));
const routes=['/','/route','/explore','/explore/lake','/live','/your-day','/credits'];
const home={state:'empty',product:null,content:{},date:null,timezone:null,price:'',frequency:'Unavailable',departures:[],schedule:'empty',adultFares:[]};
const reviews={reviews:[{id:'review-1',author:'Fixture guest',rating:5,body:'A published fixture review.',source:'Direct',review_date:null,original_url:null,avatar_url:null,language:null,featured:false,published:true,display_order:0,updated_at:''}],settings:{display_limit:3,google_reviews_url:null,leave_review_url:null}};

test('active homepage visibility flags remove their edited content and restore it from the same source',()=>{
 const keys={hero:'hero.title',reviews:'reviews.title'};
 const c={...initialWebsiteContent,...Object.fromEntries(Object.entries(keys).map(([section,key])=>[key,'Audit '+section+' marker']))};
 const page=content=>render(h(React.Fragment,null,h(HomepageView,{home:{...home,product:{title:'Test ticket',inclusions:'Configured benefits'}},content,reviews,places:[]}),h(Footer,{content,previewPathname:'/'})));
 for(const [section] of Object.entries(keys)){
  for(const visible of [true,false,true]){
   const html=page({...c,[section+'.showOnHomepage']:String(visible)});
   assert.equal(html.includes('Audit '+section+' marker'),visible,section);
   for(const other of Object.keys(keys).filter(value=>value!==section))assert.ok(html.includes('Audit '+other+' marker'),other);
  }
 }
});

test('retired notebook and invitation stay absent after saved flags are enabled; business footer stays connected',async()=>{
 const db=await createTestDatabase();try{
 await loadDevelopmentFixtures(db);const op='10000000-0000-4000-8000-000000000001';
 const uid=(await db.query('insert into auth.users values(gen_random_uuid()) returning id')).rows[0].id;
 const actor=(await db.query("insert into staff_profiles(operator_id,auth_user_id,role) values($1,$2,'owner') returning id",[op,uid])).rows[0].id;
 const row=async()=>(await db.query("select * from content_pages where operator_id=$1 and slug='website-homepage'",[op])).rows[0];
 const save=async(c,action)=>db.query('select save_website_content_v1($1,$2,$3,$4,$5)',[op,actor,JSON.stringify(c),(await row())?.updated_at??null,action]);
 const c={...initialWebsiteContent,'notebook.title':'Retired notebook marker','final.title':'Retired invitation marker','final.image':'/images/bridge-view.webp','final.alt':'Retired banner image','footer.business':'Published business name'};
 await save(c,'initialize');
 for(const visible of [true,false,true]){
 c['final.showOnHomepage']=String(visible);c['notebook.showOnHomepage']=String(visible);await save(c,'draft');await save(c,'publish');const published=(await row()).published_body.content;
 assert.equal(published['final.title'],c['final.title']);assert.equal(published['notebook.title'],c['notebook.title'],'historical data is retained');
 for(const pathname of [...routes,'/faq','/book','/booking/example']){
 const html=render(h(React.Fragment,null,pathname==='/'?h(HomepageView,{home,content:published,reviews,places:[]}):null,h(Footer,{content:published})));
 for(const retired of ['p-footer-cta','p-site-footer','p-editorial','Retired notebook marker','Retired invitation marker','Retired banner image'])assert.equal(html.includes(retired),false,pathname+': '+retired);
 assert.equal((html.match(/<footer/g)||[]).length,1);assert.ok(html.includes('Published business name'));assert.ok(html.includes('VAT: '+published['footer.vat']));assert.match(html,/href="\/privacy-policy"/);assert.match(html,/href="\/terms-and-conditions"/);
 }
 }
 }finally{await db.close();}
});
test('shared section flags remove secondary Live consumers but preserve independent map and booking',()=>{
 const c={...initialWebsiteContent,...Object.fromEntries(['route','live','departures','reviews'].map(id=>[id+'.showOnHomepage','false']))};
 const live=render(h(LiveView,{c,places:[]}));assert.ok(live.includes('<h1>Live map</h1>'));assert.ok(live.includes('<iframe'));assert.ok(!live.includes(c['route.title']));assert.ok(!live.includes(c['live.title']));
 const homepage=render(h(HomepageView,{home,content:c,reviews,places:[]}));assert.ok(!homepage.includes('id="route"'));
});
test('unavailable publication never restores visible defaults, and optional anchors follow their sections',()=>{
 const c=unavailableWebsiteContent();for(const id of ['hero','intro','route','live','departures','reviews','notebook','final'])assert.equal(sectionVisible(c,id),false);
 assert.equal(visibleWebsiteLink('/#route',c),true);assert.equal(visibleWebsiteLink('/tour#timetable',c),false);
 for(const link of ['/tour','/live','/explore','/tour#faq'])assert.equal(visibleWebsiteLink(link,c),true);
 assert.equal(sectionVisible({...initialWebsiteContent,'final.showOnHomepage':'false'},'final'),false);
});

test('unified journey shares visibility flags while prioritizing one map without a promotional booking card',async()=>{
 const {RouteJourney}=await import('../../src/components/public/route-journey.tsx');
 const initial={date:'2026-09-30',title:'Today',times:[],fares:[],stops:[{id:'stop-1',label:'Stop 1 - Start'}]};
 for(const visible of [true,false,true]){
 const content={...initialWebsiteContent,'route.showOnHomepage':String(visible),'departures.showOnHomepage':String(visible),'live.showOnHomepage':'false'};
 const html=render(h(RouteJourney,{content,initial,places:[]}));
 assert.equal((html.match(/<iframe/g)||[]).length,1);
 assert.equal(html.includes('id="journey-title"'),visible);
 assert.equal(html.includes('id="journey-departures"'),visible);
 assert.equal(html.includes('Book your day'),false);
 assert.equal(html.includes('journey-ticket'),false);
 if(visible)assert.ok(html.indexOf('id="journey-map"')<html.indexOf('id="journey-title"'));
 }
});

 test('dedicated FAQ retains edited CMS questions and product inclusions',async()=>{
 const {FaqPage}=await import('../../src/components/public/faq-page.tsx');
 const c={...initialWebsiteContent,'tourPage.faqTitle':'Edited FAQ title','tourPage.faqBook':'Edited booking question'};
 delete c['faq.items']; // Historical content is normalized without losing custom questions.
 const faq=render(h(FaqPage,{content:c,inclusions:'Published inclusion answer'}));
 for(const marker of ['Edited FAQ title','Edited booking question','Published inclusion answer'])assert.ok(faq.includes(marker));
 assert.equal((faq.match(/<details/g)||[]).length,4);
 assert.ok(!faq.includes('tour-route'));assert.ok(!faq.includes('Guest reviews'));
 });
