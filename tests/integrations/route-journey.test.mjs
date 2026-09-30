import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJourney} from '../../src/modules/tracking/journey-contract.ts';
const snapshot=(state='current')=>({type:'shkodra:journey',version:1,unavailable:false,stops:[{id:'stop-a',label:'Start',state,eta:''}]});
test('journey bridge accepts only versioned bounded public stop projections',()=>{assert.ok(parseJourney(snapshot()));for(const bad of [null,{}, {...snapshot(),version:2},{...snapshot(),stops:[...snapshot().stops,...snapshot().stops]},snapshot('made-up'),{...snapshot(),stops:[{...snapshot().stops[0],eta:45}]}])assert.equal(parseJourney(bad),null);});
test('journey preserves upstream states without calculating ETA or inferring skipped stops',()=>{for(const state of ['current','next','departed','upcoming'])assert.equal(parseJourney(snapshot(state)).stops[0].state,state);const value=snapshot('next');value.stops[0].eta='14 min';assert.equal(parseJourney(value).stops[0].eta,'14 min');});
