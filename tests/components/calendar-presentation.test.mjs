import assert from 'node:assert/strict';
import {test} from 'node:test';
import {calendarDayPresentation as present} from '../../src/app/admin/calendar-presentation.ts';
const day={date:'2030-06-01',range:null,exception:null,slots:[{open:true,remaining:6,capacity:8}]};
test('standard dates have no marker and presentation does not mutate operational data',()=>{const copy=structuredClone(day);assert.equal(present(day).marker,'');assert.equal(present(day).departures,1);assert.deepEqual(day,copy);});
test('nested departure price and schedule overrides remain identifiable',()=>{assert.deepEqual(present({...day,range:{departures:{'09:00':{prices:{adult:0}}}}}).labels,['Custom price']);assert.deepEqual(present({...day,range:{times:[{time:'11:00'}]}}).labels,['Custom schedule']);});
test('closed dates without inventory differ from no-service dates',()=>{assert.equal(present({...day,slots:[],range:{closed:true}}).state,'Closed');assert.equal(present({...day,slots:[]}).state,'No service');});
test('single-day reopening takes precedence and sold-out remains open',()=>{assert.equal(present({...day,range:{closed:true},exception:{closed:false,calendar_settings:{},departure_times:[]}}).state,'Open');const full=present({...day,slots:[{open:true,remaining:0}]});assert.equal(full.state,'Open');assert.equal(full.full,true);});
