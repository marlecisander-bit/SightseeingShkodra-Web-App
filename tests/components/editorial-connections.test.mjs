import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent as initial,editableWebsiteSections} from '../../src/modules/content/website-schema.ts';
import {editorialMetadata} from '../../src/modules/content/seo.ts';
import {emptyHomepage} from '../../src/modules/content/homepage.ts';
import {bookingEmailTemplate} from '../../src/modules/integrations/booking-email-template.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {BookingProvider}=await import('../../src/components/public/booking.tsx');
const {HomepageView}=await import('../../src/components/public/homepage-view.tsx');
const {RouteJourney}=await import('../../src/components/public/route-journey.tsx');
const {ExploreView,TourView}=await import('../../src/components/public/editorial-pages.tsx');
const h=React.createElement,render=(component,props)=>renderToStaticMarkup(h(BookingProvider,{preview:true},h(component,props)));
const home={...emptyHomepage('ready'),product:{id:'test',slug:'test',title:'Synthetic ticket',description:'Authoritative product description',inclusions:'Synthetic inclusions',stops:[]}};
const c={...initial,...Object.fromEntries(editableWebsiteSections.flatMap(s=>s.fields).filter(f=>f.key.startsWith('labels.')||/^(homeRoute|routePage)\./.test(f.key)&&f.kind==='text').map(f=>[f.key,'Edited '+f.key])),'homeRoute.title':'Visit {count} stops'};
const planner={date:'2030-06-01',title:'Test',times:[],fares:[],stops:[{id:'stable-stop',label:'Synthetic boarding'}]};
const place={id:'new-place',slug:'new-place',name:'Synthetic place',text:'Story',detail:'Detail',image:'/images/lake.webp',alt:'Synthetic photo',link:'/explore/new-place',aliases:[],showOnPage:true,stopId:'stable-stop'};
test('real public components consume edited route presentation, labels and canonical product copy',()=>{
 const reviews={reviews:[{id:'review',author:'Synthetic',rating:5,body:'Isolated review',source:'Test',original_url:'https://example.invalid/review'}],settings:{display_limit:3,google_reviews_url:'https://example.invalid/reviews',leave_review_url:'https://example.invalid/write'}};
 const html=render(HomepageView,{home,content:c,planner,places:[],reviews});
 for(const key of ['homeRoute.eyebrow','homeRoute.text','homeRoute.action','labels.ticket','labels.faq','labels.originalReview','labels.reviews','labels.leaveReview'])assert.ok(html.includes(c[key]),key);
 assert.ok(html.includes('Visit 1 stop'));assert.ok(html.includes(home.product.description));
 const route=render(RouteJourney,{content:c,initial:planner,places:[place]});for(const key of ['routePage.eyebrow','routePage.title','routePage.text','routePage.departures','routePage.stops'])assert.ok(route.includes(c[key]),key);
 assert.ok(render(ExploreView,{c,places:[place]}).includes(c['labels.guide']));
 assert.ok(render(TourView,{c,tour:home,places:[place]}).includes(c['labels.destination']));
 const hidden=render(HomepageView,{home,content:{...c,'intro.showOnHomepage':'false'},planner,places:[],reviews});
 assert.equal(hidden.includes('id="home-ticket"'),false);assert.equal(hidden.includes(home.product.description),false);
});
test('all four page SEO owners supply title, description and social image without changing robots',()=>{
 for(const prefix of ['bookPage','routePage','faqPage','explorePage']){const data={...initial,[prefix+'.seoTitle']:'Edited title',[prefix+'.seoDescription']:'Edited description',[prefix+'.seoImage']:'/images/castle.webp',[prefix+'.seoAlt']:'Edited alt'};const meta=editorialMetadata('/test',prefix,data,false);assert.equal(meta.title,'Edited title');assert.equal(meta.description,'Edited description');assert.deepEqual(meta.openGraph.images,[{url:'/images/castle.webp',alt:'Edited alt'}]);assert.equal(meta.robots.index,false);}
});
test('obsolete intro controls stay stored but are not editable; email renders the saved meeting commitment safely',()=>{
 const keys=editableWebsiteSections.flatMap(s=>s.fields.map(f=>f.key));for(const key of ['intro.text','intro.link','intro.linkLabel','hero.amenities','how.title','nav.mobileMap','nav.mobileBook','footer.line1']){assert.ok(key in initial);assert.equal(keys.includes(key),false,key);}
 const b={reference:'TEST',status:'confirmed',name:'Synthetic',createdAt:'2030-01-01',currency:'EUR',total:1000,paymentStatuses:[],items:[],meetingPoint:{name:'Saved <meeting>',directions:'Bring <ticket>',url:'https://maps.app.goo.gl/Test123',label:'Open meeting point in Google Maps',stopId:null}};
 const email=bookingEmailTemplate('BOOKING_CREATED','customer',b,{version:2,from:'test@example.invalid',replyTo:'test@example.invalid',owner:'test@example.invalid',siteUrl:'https://example.invalid',testRecipient:null},'operator','booking');
 assert.ok(email.html.includes('Saved &lt;meeting&gt;'));assert.ok(email.html.includes(b.meetingPoint.url));assert.equal(email.html.includes('rssrPnaBYZVWp316A'),false);assert.ok(email.text.includes('Bring <ticket>'));
});
