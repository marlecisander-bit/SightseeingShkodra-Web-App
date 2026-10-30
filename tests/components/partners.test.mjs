import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
import {parsePartner} from '../../src/modules/content/partners.ts';
registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,context);}});
const {PartnersSection}=await import('../../src/components/public/partners-section.tsx');
const row={id:'test',name:'Synthetic layout fixture',logo_url:'/images/lake.webp',website_url:'https://example.com',description:'Test only',display_order:1,is_active:true,updated_at:''};
const render=(partners=[row],content=initialWebsiteContent)=>renderToStaticMarkup(React.createElement(PartnersSection,{partners,content}));
test('partners hide empty, inactive and disabled sections and render ordered crawlable safe links',()=>{
 assert.equal(render([]),'');assert.equal(render([{...row,is_active:false}]),'');assert.equal(render([row],{...initialWebsiteContent,'partners.showOnHomepage':'false'}),'');
 const html=render([{...row,id:'later',name:'Later',display_order:2},row]);assert.ok(html.indexOf(row.name)<html.indexOf('Later'));assert.match(html,/target="_blank" rel="noopener noreferrer"/);assert.match(html,/loading="lazy"/);assert.match(html,/alt="Synthetic layout fixture logo"/);assert.ok(!html.includes('Discover more'));
 const unlinked=render([{...row,website_url:''}]);assert.ok(!unlinked.includes('<a '));assert.match(unlinked,/<h2 id="partners-title">Our Partners/);
});
test('optional CTA accepts internal or safe external destinations, hides unsafe ones',()=>{
 for(const url of ['/explore','https://example.com']){const html=render([row],{...initialWebsiteContent,'partners.ctaEnabled':'true','partners.ctaUrl':url});assert.ok(html.includes('Discover more'));}
 assert.ok(!render([row],{...initialWebsiteContent,'partners.ctaEnabled':'true','partners.ctaUrl':'javascript:alert(1)'}).includes('Discover more'));
});
test('partner input validates required publication logo and rejects foreign storage or unsafe URLs',()=>{
 const form=new FormData();for(const [k,v] of Object.entries({name:'Approved name',logo_url:'/images/lake.webp',website_url:'https://example.com',description:'',display_order:'3',is_active:'on'}))form.set(k,v);
 assert.equal(parsePartner(form,'test').display_order,3);
 for(const [key,value] of [['logo_url',''],['website_url','javascript:alert(1)'],['logo_url','https://test.supabase.co/storage/v1/object/public/website-media/other/00000000-0000-4000-8000-000000000001.png'],['display_order','1.5'],['name','']]){const copy=new FormData();for(const [k,v] of form)copy.set(k,v);copy.set(key,value);assert.throws(()=>parsePartner(copy,'test'));}
});
test('homepage retains partners and business footer without the retired invitation',async()=>{
 const {HomepageView}=await import('../../src/components/public/homepage-view.tsx');const {Footer}=await import('../../src/components/public/ui.tsx');const {BookingProvider}=await import('../../src/components/public/booking.tsx');const {emptyHomepage}=await import('../../src/modules/content/homepage.ts');
 const html=renderToStaticMarkup(React.createElement(BookingProvider,null,React.createElement(React.Fragment,null,React.createElement(HomepageView,{home:emptyHomepage('ready'),content:initialWebsiteContent,partners:[row],places:[]}),React.createElement(Footer,{content:initialWebsiteContent,previewPathname:'/'}))));
 assert.equal((html.match(/aria-label="Final booking invitation"/g)||[]).length,0);assert.ok(html.indexOf('class="p-global-footer"')>html.indexOf('id="partners"'));
});
