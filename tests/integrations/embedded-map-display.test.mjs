import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseJourney,presentationTtl} from '../../src/modules/tracking/journey-contract.ts';
const display={version:1,label:'PARKED AT',destination:'Fixture stop',activity:'Next departure not confirmed',eta:'Travel · ~8 min after departure',nextStop:'Fixture next stop',live:false,stops:[{id:'1',number:'1',name:'Fixture stop',label:'Current stop',state:'current'}]};
const snapshot=()=>{const now=Date.now();return ({type:'shkodra:journey',version:1,unavailable:false,phase:'PARKED',movement:'Parked at Fixture stop',lastObservationAt:new Date(now).toISOString(),statusValidUntil:new Date(now+20000).toISOString(),stops:[],embeddedDisplay:display});};
test('embedded display is additive and preserves exact upstream wording and expiry',()=>{const j=parseJourney(snapshot());const now=Date.parse(j.lastObservationAt);assert.deepEqual(j.embeddedDisplay,display);assert(presentationTtl(j,now)<=20000);assert.equal(presentationTtl(j,now+21000),0);const legacy=snapshot();delete legacy.embeddedDisplay;assert(parseJourney(legacy));});
test('display contract rejects malformed, excessive and duplicate stop data',()=>{for(const bad of [null,{}, {...display,version:2},{...display,live:'yes'},{...display,destination:'x'.repeat(241)},{...display,eta:{}},{...display,stops:Array(101).fill(display.stops[0])},{...display,stops:[...display.stops,...display.stops]},{...display,stops:[{...display.stops[0],state:'invented'}]}])assert.equal(parseJourney({...snapshot(),embeddedDisplay:bad}),null);});

test('local paired override cannot activate production even when supplied at build time',async()=>{
 const {execFileSync}=await import('node:child_process');
 const code="import {websiteExternalStatusEnabled,localMapPreviewEnabled,externalMapStatusEnabled} from './src/modules/tracking/public-map-binding.ts'; console.log(JSON.stringify([websiteExternalStatusEnabled,localMapPreviewEnabled,externalMapStatusEnabled]));";
 const flags=mode=>JSON.parse(execFileSync(process.execPath,['--import','tsx','--input-type=module','-e',code],{env:{...process.env,NODE_ENV:mode,NEXT_PUBLIC_LOCAL_MAP_PREVIEW:'1'},encoding:'utf8'}));
 const production=flags('production');
 assert.equal(typeof production[0],'boolean');
 assert.deepEqual(production,[production[0],false,production[0]]);
 assert.deepEqual(flags('development'),[production[0],true,true]);
});

test('historical context expires from source time at ten minutes; duplicate delivery cannot extend it',()=>{
 const at=Date.parse('2026-10-31T10:00:00Z'),j={...snapshot(),phase:'UNKNOWN',presentationKind:'historical_stopped',lastObservationAt:new Date(at).toISOString(),statusValidUntil:new Date(at+600000).toISOString()};
 assert(parseJourney(j));assert.equal(presentationTtl(j,at+270000),45000);assert.equal(presentationTtl(j,at+599000),1000);assert.equal(presentationTtl(j,at+600001),0);assert.equal(presentationTtl({...j,statusValidUntil:new Date(at+900000).toISOString()},at+270000),0);
 assert.equal(presentationTtl({...j,phase:'PARKED'},at+270000),0);
});
test('fresh reported context expires at ninety seconds and safe upstream artwork remains additive',()=>{
 const at=Date.now(),j={...snapshot(),phase:'UNKNOWN',presentationKind:'reported_stopped',lastObservationAt:new Date(at).toISOString(),statusValidUntil:new Date(at+90000).toISOString()};
 assert.equal(presentationTtl(j,at+89000),1000);assert.equal(presentationTtl(j,at+90001),0);
 for(const photoUrl of ['javascript:evil','data:image/png,evil','https://user:password@example.com/a.png'])assert.equal(parseJourney({...j,embeddedDisplay:{...display,stops:[{...display.stops[0],photoUrl}]}}),null);
 assert(parseJourney({...j,embeddedDisplay:{...display,stops:[{...display.stops[0],photoUrl:'https://example.com/stop.jpg',color:'#078B51'}]}}));
});
