import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialWebsiteContent,visibilityScope} from '../../src/modules/content/website-schema.ts';
import {publicNavigation,navigationDiagnostics} from '../../src/modules/content/navigation.ts';
import {mediaReferences} from '../../scripts/cms-verification/media.mjs';
registerHooks({load(url,c,next){if(url.endsWith('.module.css'))return {format:'module',shortCircuit:true,source:'export default new Proxy({}, {get:(_,key)=>String(key)});'};return next(url,c);}});
const {NavigationPreview}=await import('../../src/app/admin/navigation-preview.tsx');
const {BookingPriceIndicator}=await import('../../src/components/public/booking-controls.tsx');
const {HomepageHero}=await import('../../src/components/public/homepage-hero.tsx');
const {BookingProvider}=await import('../../src/components/public/booking.tsx');
test('navigation diagnostics reuse effective projection, identify suppressed slots, and never mutate content',()=>{
 const c={...initialWebsiteContent};const rows=navigationDiagnostics(c);assert.deepEqual(rows.filter(r=>r.visible).map(r=>({href:r.href,label:r.label})),publicNavigation(c).map(r=>({href:r.href,label:r.label})));assert.ok(rows.find(r=>r.control==='nav.0.label').warning);assert.ok(rows.find(r=>r.control==='nav.3.label').warning);assert.deepEqual(c,initialWebsiteContent);
 const changed={...c,'nav.0.link':'/credits','nav.0.label':'Unique credits'};assert.ok(navigationDiagnostics(changed).find(r=>r.control==='nav.0.label').visible);const html=renderToStaticMarkup(React.createElement(NavigationPreview,{content:changed}));assert.ok(html.includes('Unique credits'));assert.ok(html.includes('Duplicate destination'));assert.ok(html.includes('/credits'));
});
test('zero teaser displays authoritative €0 while missing/invalid prices remain unavailable',()=>{
 const html=amount=>renderToStaticMarkup(React.createElement(BookingPriceIndicator,{amount,currency:'EUR',date:'2030-06-01'}));assert.ok(html(0).includes('€0'));assert.ok(html(0).includes('From'));assert.ok(html(0).includes('Per adult'));for(const amount of [undefined,-1,NaN,Infinity])assert.ok(html(amount).includes('Check availability'));assert.ok(html(1000).includes('€10'));
});
test('hero wide focal transform is characterized for all nine stored positions without changing composition',()=>{
 for(const x of ['left','center','right'])for(const y of ['top','center','bottom']){const pos=x+' '+y,c={...initialWebsiteContent,'hero.desktopPosition':pos};const html=renderToStaticMarkup(React.createElement(BookingProvider,null,React.createElement(HomepageHero,{content:c})));assert.ok(html.includes('--hero-desktop-position:'+pos));assert.ok(html.includes('--hero-wide-position:'+pos.replace(/ center$/,' bottom')));}
});
test('visibility scope names actual public consumers and preserves the mandatory map distinction',()=>{
 assert.match(visibilityScope('route'),/Homepage, Route.*Your day.*map stays available/);assert.match(visibilityScope('reviews'),/Homepage Guest Reviews/);assert.match(visibilityScope('notebook'),/Explore guides stay available/);assert.match(visibilityScope('departures'),/booking availability stays available/);assert.match(visibilityScope('final'),/except FAQ, Book/);
});
test('media references retain draft, published and historical JSON uses and never infer deletion safety',()=>{
 const asset='https://example.invalid/storage/v1/object/public/website-media/operator/photo.webp';const result=mediaReferences({draft:{image:asset+'?token=synthetic'},published:{'hero.desktop':'/images/castle.webp'},historical:JSON.stringify({image:asset})},[asset,'/images/unused.webp']);assert.equal(result.deletionAllowed,false);assert.equal(result.assets.find(x=>x.asset===asset).references.length,2);assert.ok(!JSON.stringify(result).includes('token='));assert.match(result.assets.find(x=>x.asset==='/images/unused.webp').status,/retain pending/);assert.ok(result.assets.find(x=>x.asset==='/images/castle.webp'));
});

test('media CLI reads only supplied local JSON and refuses remote and production inputs',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cms-media-'));try{
  const file=join(dir,'snapshot.json');writeFileSync(file,JSON.stringify({documents:{draft:{photo:'/images/lake.webp'}},objects:['/images/unused.webp']}));
  const run=(path,env={})=>spawnSync(process.execPath,['scripts/report-media-usage.mjs',path],{encoding:'utf8',env:{...process.env,...env}});
  const local=run(file);assert.equal(local.status,0,local.stderr);const report=JSON.parse(local.stdout);assert.equal(report.readOnly,true);assert.equal(report.deletionAllowed,false);assert.equal(report.assets.length,2);
  assert.notEqual(run('https://example.invalid/snapshot.json').status,0);assert.match(run(file,{APP_ENV:'production'}).stderr,/disposable local environment/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
