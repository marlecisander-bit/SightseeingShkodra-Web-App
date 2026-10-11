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
 for(const text of ['Saved heading','Saved emphasis','Saved subtitle','Saved long copy','Saved booking action','Saved live action','right bottom','left top','castle.webp','centre.webp'])assert.ok(html.includes(text),text);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.equal((html.match(/<picture>/g)||[]).length,1);assert.ok(html.includes('href="/route"'));
});
test('one hero widget presents canonical dated fare and the existing passenger controls',()=>{
 const html=render();assert.ok(html.includes('23.75'));assert.ok(html.includes('2030-07-01'));assert.equal((html.match(/type="date"/g)||[]).length,1);
 assert.equal((html.match(/type="submit"/g)||[]).length,1);assert.ok(html.includes('All Day'));assert.ok(html.includes('Hop On / Hop Off'));assert.ok(html.includes('5 Stops'));
 for(const label of ['Add one adult','Add one child','Add one infant','No seat required'])assert.ok(html.includes(label));assert.ok(!html.includes('<iframe'));
});
test('unpublished product and missing fare never fabricate ticket offers or prices',()=>{
 const absent=render({}, {productTitle:undefined,fare:undefined,stopCount:undefined});assert.ok(!absent.includes('type="date"'));assert.ok(!absent.includes('All Day'));assert.ok(!absent.includes('From €'));assert.ok(!absent.includes('5 Stops'));
 const noFare=render({}, {fare:undefined});assert.ok(noFare.includes('Choose a date'));assert.ok(!noFare.includes('From €'));
});
