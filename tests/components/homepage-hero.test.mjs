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
 assert.equal(html.includes('href="#experiences"'),true);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.equal((html.match(/<picture>/g)||[]).length,1);assert.ok(html.includes('href="/route"'));
});
test('hero introduces the experiences below without a privileged ticket widget',()=>{
 const html=render();assert.ok(html.includes('Choose your experience'));assert.ok(html.includes('href="#experiences"'));assert.equal((html.match(/type="date"/g)||[]).length,0);assert.equal((html.match(/type="submit"/g)||[]).length,0);assert.ok(!html.includes('23.75'));assert.ok(!html.includes('<iframe'));
});
test('missing product and fare do not fabricate ticket claims in the hero',()=>{
 const html=render({}, {productTitle:undefined,fare:undefined,stopCount:undefined});assert.ok(!html.includes('type="date"'));assert.ok(!html.includes('From €'));assert.ok(!html.includes('5 Stops'));
});
test('retired hero amenities never render from saved rows or automatic defaults',()=>{
 const saved={id:'00000000-0000-4000-8000-000000000001',title:'Saved multilingual guide',icon:'headphones',description:'Historical description',display_order:1,published:true,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'};
 for(const value of ['[]',JSON.stringify([saved]),JSON.stringify([{...saved,published:false}])]){const html=render({'hero.amenities':value});assert.ok(!html.includes('Saved multilingual guide'));assert.ok(!html.includes('Daily ticket benefits'));assert.ok(!html.includes('Audio Guide'));assert.ok(!html.includes('5 Stops'));assert.ok(html.includes('href="#experiences"'));}
});

test('typographic destination split preserves all saved headline words and one semantic H1',()=>{
 const html=render({'hero.title':'Discover Shkodra.','hero.emphasis':'Your way.'});
 const title=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
 assert.equal(title,'Discover Shkodra. Your way.');assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 for(const heading of ['Découvrez cette ville magnifique à votre rythme','探索这座城市的每一条街道','اكتشف المدينة بطريقتك']){
  const translated=render({'hero.title':heading,'hero.emphasis':'Saved translated ending'});assert(translated.includes(heading));assert(translated.includes('Saved translated ending'));
 }
});
