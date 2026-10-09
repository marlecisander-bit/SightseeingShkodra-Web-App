import test from 'node:test';
import assert from 'node:assert/strict';
import {sightseeingStops,sightseeingStatus} from '../../src/modules/content/sightseeing-stops.ts';
const stops=[{id:'a',label:'Stop 1 - Start'},{id:'b',label:'Stop 2 - Lake'},{id:'c',label:'Stop 3 - Castle'}];
const places=[{id:'lake',name:'Lake guide',stopId:'b',text:'Editorial',link:'/explore/lake'}];
const journey=(rows,unavailable=false)=>({type:'shkodra:journey',version:1,unavailable,stops:rows.map(([id,state,eta=''])=>({id,state,eta,label:id}))});
test('canonical stop order and stable ID matching preserve ownership',()=>{const result=sightseeingStops(stops,places,journey([['c','next','14 min'],['a','departed']]));assert.deepEqual(result.map(s=>s.id),['a','b','c']);assert.equal(result[1].name,'Lake guide');assert.equal(result[1].state,'upcoming');assert.equal(result[2].eta,'14 min');assert.equal(sightseeingStops(stops,[...places,...places])[1].place,undefined);});
test('unavailable and stale states never assert live progress',()=>{const source=journey([['a','current']],true);assert.equal(sightseeingStops(stops,places,source)[0].state,'upcoming');assert.match(sightseeingStatus(sightseeingStops(stops,places),source),/unavailable/);assert.match(sightseeingStatus(sightseeingStops(stops,places),null,true),/stale/);});
test('parked status takes precedence over ETA, loops do not accumulate departed stops',()=>{const first=journey([['a','current'],['b','next','5 min']]);assert.equal(sightseeingStatus(sightseeingStops(stops,places,first),first),'Van at Start');const next=journey([['a','departed'],['b','next','5 min']]);assert.match(sightseeingStatus(sightseeingStops(stops,places,next),next),/5 min/);assert.equal(sightseeingStops(stops,places,journey([['a','current']]))[1].state,'upcoming');});
