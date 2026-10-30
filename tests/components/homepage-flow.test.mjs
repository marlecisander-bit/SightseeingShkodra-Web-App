import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
import {emptyHomepage} from '../../src/modules/content/homepage.ts';
import {plannerClock} from '../../src/modules/content/day-planner.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {HomepageView}=await import('../../src/components/public/homepage-view.tsx');
const {BookingProvider}=await import('../../src/components/public/booking.tsx');
const home={...emptyHomepage('ready'),product:{id:'product',slug:'ticket',title:'Published ticket title',description:'Published product description',inclusions:'Only the configured inclusion',stops:[]},heroFare:{amount:1750,currency:'EUR',date:'2030-06-01'}};
const planner={date:plannerClock().date,title:home.product.title,times:[],fares:[],stops:[{id:'operational-1',label:'Actual boarding point'}]};
const c={...initialWebsiteContent,'how.0.title':'Published step','intro.title':'Published story','route.title':'Published highlights','notebook.showOnHomepage':'false'};
const render=(content=c,data=home,plan=planner)=>renderToStaticMarkup(React.createElement(BookingProvider,null,React.createElement(HomepageView,{home:data,content,planner:plan,places:[]})));
test('homepage retains hero and operational stops without the retired service section',()=>{
 const html=render();
 const markers=['id="home-hero"','id="route"'];
 for(let i=1;i<markers.length;i++)assert.ok(html.indexOf(markers[i])>html.indexOf(markers[i-1]),markers[i]);
 for(const value of ['Actual boarding point','17.50'])assert.ok(html.includes(value),value);
 assert.ok(!html.includes('Published step'));assert.ok(!html.includes('Published highlights'));assert.ok(!html.includes('home-intro'));
 assert.ok(html.includes('1 stop around Shkodra'));
 assert.equal(html.includes('aria-label="Live service"'),false);
 assert.equal(html.includes('Wi-Fi'),false);
});
test('missing product, operational route and schedule never fabricate a price, five stops or a departure',()=>{
 const html=render(c,emptyHomepage('unavailable'),{...planner,stops:null,times:null});
 assert.equal(html.includes('id="home-ticket"'),false);
 assert.equal(html.includes('5 stops'),false);
 assert.equal(html.includes('From €'),false);
 assert.ok(html.includes('Check availability'));
 assert.match(html, /<h2>[^<]*Published stops[^<]*<\/h2>/);
 assert.ok(html.includes('Published stops are temporarily unavailable.'));
});
test('retired service section stays absent with either saved visibility setting',()=>{
 for(const flag of ['true','false']) {
  const html=render({...c,'live.showOnHomepage':flag,'departures.showOnHomepage':flag});
  for(const value of ['p-home-service','More time here.','Less time waiting.','Show live map here','TODAY, AT A GLANCE','<iframe'])assert.equal(html.includes(value),false,value);
  assert.ok(html.includes('id="home-hero"'));
  assert.ok(html.includes('Actual boarding point'));
 }
});

test('Admin homepage order has one owner per section and matches the public progression',async()=>{
 const {websiteEditorGroups,editableWebsiteSections}=await import('../../src/modules/content/website-schema.ts');
 assert.deepEqual(websiteEditorGroups.homepage.map(s=>s.id),['hero','heroAmenities','homeRoute','route','notebook','reviews','final','partners']);
 assert.equal(editableWebsiteSections.filter(s=>s.id==='how').length,0);
 assert.equal(new Set(editableWebsiteSections.flatMap(s=>s.fields.map(f=>f.key))).size,editableWebsiteSections.flatMap(s=>s.fields).length);
});

test('hiding the hero retains exactly one page heading without revealing hidden hero copy',()=>{
 const html=render({...c,'hero.showOnHomepage':'false','hero.title':'Hidden hero text'});
 assert.equal((html.match(/<h1[ >]/g)??[]).length,1);
 assert.equal(html.includes('Hidden hero text'),false);
});

test('stale CMS promotion flags cannot restore the section or its spacing wrapper',()=>{
 for(const flag of ['true','false']) {
 const html=render({...c,'intro.showOnHomepage':flag});
 for(const value of ['id="home-ticket"','p-daily-ticket','home-ticket-service','Published story','Published product description','Only the configured inclusion'])assert.equal(html.includes(value),false,value);
 assert.ok(html.includes('id="home-hero"'));assert.ok(html.includes('type="submit"'));assert.ok(html.includes('Book your day'));
 }
});
