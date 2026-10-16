import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {HomepageHero}=await import('../../src/components/public/homepage-hero.tsx');
const {BookingProvider}=await import('../../src/components/public/booking.tsx');
const render=(overrides={},props={})=>renderToStaticMarkup(React.createElement(BookingProvider,null,React.createElement(HomepageHero,{content:{...initialWebsiteContent,...overrides},productTitle:'Published daily ticket',stopCount:5,fare:{amount:2375,currency:'EUR',date:'2030-07-01'},...props})));
test('hero retains saved CMS identity, photographs, focal points and action labels',()=>{
 const html=render({'hero.title':'Saved heading','hero.emphasis':'Saved emphasis','hero.subtitle':'Saved subtitle','hero.description':'Saved long copy','hero.desktop':'/images/castle.webp','hero.mobile':'/images/centre.webp','hero.desktopPosition':'right bottom','hero.mobilePosition':'left top','hero.book':'Saved booking action','hero.track':'Saved live action'});
 for(const text of ['Saved heading','Saved emphasis','Saved subtitle','Saved long copy','Saved live action','right bottom','left top','castle.webp','centre.webp'])assert.ok(html.includes(text),text);
 assert.equal(html.includes('Saved booking action'),true);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.equal((html.match(/<picture>/g)||[]).length,1);assert.ok(html.includes('href="/route"'));
});
test('one hero widget presents canonical dated fare and the existing passenger controls',()=>{
 const html=render();assert.ok(html.includes('23.75'));assert.ok(html.includes('2030-07-01'));assert.equal((html.match(/type="date"/g)||[]).length,1);
 assert.equal((html.match(/type="submit"/g)||[]).length,1);assert.ok(html.includes('All Day'));assert.ok(html.includes('Hop On/Off'));assert.ok(html.includes('5 Stops'));
 for(const label of ['Add one adult','Add one child','Add one infant','No seat required'])assert.ok(html.includes(label));assert.ok(!html.includes('<iframe'));
});
test('unpublished product and missing fare never fabricate ticket offers or prices',()=>{
 const absent=render({}, {productTitle:undefined,fare:undefined,stopCount:undefined});assert.ok(!absent.includes('type="date"'));assert.ok(!absent.includes('All Day'));assert.ok(!absent.includes('From €'));assert.ok(!absent.includes('5 Stops'));
 const noFare=render({}, {fare:undefined});assert.ok(noFare.includes('Choose a date'));assert.ok(!noFare.includes('From €'));
});
test('hero benefits use published CMS amenities, preserving order and suppressing draft claims',()=>{
 const item=(id,title,icon,display_order,published=true)=>({id:`00000000-0000-4000-8000-${id.padStart(12,'0')}`,title,icon,description:'Saved detail',display_order,published,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'});
 const html=render({'hero.amenities':JSON.stringify([item('1','Draft Wi-Fi','wifi',0,false),item('2','Saved tracking','map',2),item('3','Saved iconic stops','stop',1)])});
 assert.ok(html.includes('Saved iconic stops'));assert.ok(html.includes('Saved tracking'));assert.ok(!html.includes('Draft Wi-Fi'));
 assert.ok(html.indexOf('Saved iconic stops')<html.indexOf('Saved tracking'));assert.ok(!html.includes('Hop On/Off'));
 const fallback=render();assert.ok(!fallback.includes('Free Wi-Fi'));assert.ok(fallback.includes('5 Stops'));
});

test('default hero benefits include Audio Guide in the requested five-item order',()=>{
 const html=render();const row=html.slice(html.indexOf('<ul'),html.indexOf('</ul>'));
 assert.equal((row.match(/<li/g)||[]).length,5);
 const labels=['5 Stops','All Day','Hop On/Off','Audio Guide',initialWebsiteContent['hero.track']];
 for(let i=1;i<labels.length;i++)assert.ok(row.indexOf(labels[i-1])<row.indexOf(labels[i]));
});

test('hiding every saved amenity does not restore default marketing claims',()=>{
 const hidden={id:'00000000-0000-4000-8000-000000000001',title:'Audio Guide',icon:'headphones',description:'',display_order:1,published:false,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'};
 const html=render({'hero.amenities':JSON.stringify([hidden])});const row=html.slice(html.indexOf('<ul'),html.indexOf('</ul>'));
 assert.equal((row.match(/<li/g)||[]).length,0);
});
