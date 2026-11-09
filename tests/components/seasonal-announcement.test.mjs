import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seasonalActive,seasonalDefaults} from '../../src/modules/content/seasonal-announcement.ts';
import {initialWebsiteContent,validateWebsiteContent,globalEditorSections,homepageEditorSections,unavailableWebsiteContent} from '../../src/modules/content/website-schema.ts';
const on={...initialWebsiteContent,'seasonal.enabled':'true'};
test('announcement uses inclusive Tirane dates across UTC and daylight saving boundaries; Off overrides schedule',()=>{
 for(const [instant,active] of [['2026-10-31T22:59:59Z',false],['2026-10-31T23:00:00Z',true],['2027-04-30T21:59:59Z',true],['2027-04-30T22:00:00Z',false]])assert.equal(seasonalActive(on,new Date(instant)),active,instant);
 assert.equal(seasonalActive({...on,'seasonal.enabled':'false'},new Date('2026-11-09')),false);
 assert.equal(seasonalActive(unavailableWebsiteContent(),new Date('2026-11-09')),false);
});
test('legacy CMS content upgrades with announcement Off; editable copy and dates roundtrip without touching product configuration',()=>{
 const old=Object.fromEntries(Object.entries(initialWebsiteContent).filter(([key])=>!key.startsWith('seasonal.')));
 const upgraded=validateWebsiteContent(old);assert.equal(upgraded['seasonal.enabled'],'false');
 const saved=validateWebsiteContent({...on,'seasonal.message':'Special winter visits','seasonal.stops':'Lake\nBridge'});
 assert.equal(saved['seasonal.message'],'Special winter visits');assert.equal(saved['seasonal.stops'],'Lake\nBridge');
 assert(globalEditorSections.some(s=>s.id==='seasonal'));assert(!homepageEditorSections.some(s=>s.id==='seasonal'));
 for(const patch of [{'seasonal.start':'2026-02-30'},{'seasonal.end':'2026-01-01'},{'seasonal.enabled':'yes'}])assert.throws(()=>validateWebsiteContent({...on,...patch}));
 assert.equal(seasonalDefaults['seasonal.departures'],'09:00 · 11:00 · 13:00');
});
