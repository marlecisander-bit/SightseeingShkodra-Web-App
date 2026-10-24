import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {WebsiteHome}=await import('../../src/app/admin/website-home.tsx');
const {ReviewSummary,PartnerSummary}=await import('../../src/app/admin/website-engagement.tsx');
const render=props=>renderToStaticMarkup(React.createElement(WebsiteHome,{operatorId:'fixture',content:initialWebsiteContent,published:initialWebsiteContent,canSensitive:true,onOpen(){},...props}));
test('Website home offers existing canonical destinations and contextual media without mounting mutation forms',()=>{
 const html=render();for(const label of ['Homepage','Route &amp; Live Map','FAQ','Images &amp; media','Homepage SEO','Privacy Policy','Terms &amp; Conditions'])assert(html.includes(label),label);
 for(const route of ['reviews','partners','route-stops'])assert(html.includes(`/admin/fixture/${route}`));
 assert(html.includes('website-preview?page=route'));assert(html.includes('hero'));assert(!html.includes('<form'));assert(!html.includes('<iframe'));assert(!html.includes('page=tour'));
});
test('Website publication comparison and destination status do not claim unsupported translation or publication states',()=>{
 const html=render({content:{...initialWebsiteContent,'hero.title':'Local draft'}});assert(html.includes('Saved draft changes'));assert(html.includes('Publication managed per destination'));assert(html.includes('Content language: English'));assert(!html.includes('name="language"'));assert(!html.includes('Translation complete'));
 const restricted=render({canSensitive:false});assert(!restricted.includes('Edit Privacy Policy'));assert(!restricted.includes('Edit Terms &amp; Conditions'));assert(restricted.includes('Edit FAQ'));
});
test('engagement summaries retain original review text, language, display order and partner visibility without new moderation actions',()=>{
 const html=renderToStaticMarkup(React.createElement(ReviewSummary,{review:{author:'Synthetic guest',body:'Original review & wording',source:'Direct',review_date:'2026-10-24',language:'it',published:false,rating:4,display_order:7,featured:true}}));
 for(const text of ['Original review &amp; wording','it','Draft','Order 7','Featured','4/5'])assert(html.includes(text));assert(!html.includes('Approve'));
 const partner=renderToStaticMarkup(React.createElement(PartnerSummary,{partner:{name:'Fixture partner',logo_url:'/images/lake.webp',website_url:'https://example.test',is_active:true,display_order:3}}));for(const text of ['Fixture partner','https://example.test','Active','Order 3'])assert(partner.includes(text));
});
