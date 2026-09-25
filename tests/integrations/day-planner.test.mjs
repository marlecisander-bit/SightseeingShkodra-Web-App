import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plannerClock,plannerSummary} from '../../src/modules/content/day-planner.ts';
const data={date:'2026-09-25',title:'Tour',times:['09:00','11:00','13:00','15:00'],fares:[{time:'13:00',amount:800},{time:'15:00',amount:1000}],stops:[]};
test('Tirane clock is independent of visitor timezone',()=>{assert.deepEqual(plannerClock(new Date('2026-09-24T22:15:00Z')),{date:'2026-09-25',time:'00:15'});});
test('before first departure',()=>assert.equal(plannerSummary(data,new Date('2026-09-25T06:00Z')).status,'Next: 09:00'));
test('between departures excludes past slots',()=>assert.deepEqual(plannerSummary(data,new Date('2026-09-25T10:15Z')).upcoming,['13:00','15:00']));
test('after last departure',()=>assert.equal(plannerSummary(data,new Date('2026-09-25T14:00Z')).status,'Service finished for today'));
test('closed day distinct from finished service',()=>assert.equal(plannerSummary({...data,times:[]},new Date('2026-09-25T10:00Z')).status,'No service today'));
test('effective offers and zero fares retained',()=>{assert.equal(plannerSummary(data,new Date('2026-09-25T10:00Z')).price,800);assert.equal(plannerSummary({...data,fares:[{time:'13:00',amount:0}]},new Date('2026-09-25T10:00Z')).price,0);});
test('independent fare and schedule failures',()=>{assert.equal(plannerSummary({...data,fares:[]},new Date('2026-09-25T10:00Z')).status,'Next: 13:00');assert.equal(plannerSummary({...data,times:null},new Date('2026-09-25T10:00Z')).price,800);});
test('new local day never displays previous day schedule',()=>assert.equal(plannerSummary(data,new Date('2026-09-25T22:01Z')).status,'View today’s schedule'));

import {mapStopSummary} from '../../src/modules/content/map-stop-summary.ts';
test('published stop additions, removal, ordering and loop identity',()=>{const f=(id,n)=>({geometry:{type:'Point'},properties:{objectId:id,stopNumber:n,name:id}});assert.deepEqual(mapStopSummary([f('b',2),f('a',1),f('a',1)]).map(x=>x.id),['a','b']);assert.deepEqual(mapStopSummary([f('c',3),f('b',1)]).map(x=>x.id),['b','c']);});
