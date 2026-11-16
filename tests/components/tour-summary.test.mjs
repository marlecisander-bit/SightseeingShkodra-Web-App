import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent} from '../../src/modules/content/website-schema.ts';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',source:'export default {}',shortCircuit:true};return next(url,c);}});
const {TourSummary}=await import('../../src/components/public/tour-summary.tsx');
test('initial server HTML distinguishes tour entitlements, exposes published facts and keeps unavailable sales closed',()=>{
 const panorama={id:'7d7257f2-ee83-43cf-85bf-5dba3bbf5196',title:'Sightseeing Panorama Tour',mode:'selected_departure',minutes:120,card:{enabled:true,description:'Published panorama description'}};
 const daily={id:'daily',title:'Hop On Hop Off - Daily Ticket',mode:'selected_departure',minutes:120,active:false,card:{enabled:true,description:'Published Daily Ticket description'}};
 const html=renderToStaticMarkup(React.createElement(TourSummary,{products:[panorama,daily],content:{...initialWebsiteContent,'seasonal.enabled':'true','seasonal.start':'2020-01-01','seasonal.end':'2099-12-31'},meeting:{name:'Published boarding point',directions:'Published instructions',url:'https://maps.app.goo.gl/rssrPnaBYZVWp316A',label:'View boarding point'},inclusions:{[panorama.id]:'Only the verified inclusion'}}));
 for(const text of ['Approximately two hours','09:00','11:00','13:00','15 minutes','Mesi Bridge','Only the verified inclusion','Published boarding point','not valid for 24 hours','selected operating day','April 2027','id="daily-ticket"'])assert.ok(html.includes(text),text);
 assert.ok(html.includes('/book?productId='+panorama.id));assert.ok(!html.includes('/book?productId=daily'));assert.ok(!html.includes('aggregateRating'));
 assert.equal(renderToStaticMarkup(React.createElement(TourSummary,{products:[],content:{},meeting:null,inclusions:{}})),'');
});
