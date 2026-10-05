import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toggleCalendarDeparture } from '../../src/app/admin/calendar-editing.ts';

test('reopening one time on a closed day retains all other closures and agreed editor overrides', () => {
  const original = {closed:true,times:[{time:'09:00'},{time:'11:00'}],prices:{adult:1200},departures:{'09:00':{capacity:6},'11:00':{prices:{child:500}}}};
  const next = toggleCalendarDeparture(original,undefined,[],'11:00',true);
  assert.equal(next.closed,false);
  assert.deepEqual(next.departures,{'09:00':{capacity:6,closed:true},'11:00':{prices:{child:500},closed:false}});
  assert.deepEqual(next.prices,original.prices);
  assert.equal(original.closed,true);
  assert.equal(original.departures['09:00'].closed,undefined);
});
test('reopening an omitted closed time adds it once; closing it preserves its price and capacity', () => {
  const original = {times:[{time:'11:00'}],departures:{'09:00':{closed:true,capacity:8,prices:{adult:1000}}}};
  const opened = toggleCalendarDeparture(original,undefined,[],'09:00',true);
  assert.deepEqual(opened.times,[{time:'09:00'},{time:'11:00'}]);
  assert.deepEqual(toggleCalendarDeparture(opened,undefined,[],'09:00',true).times,opened.times);
  const closed = toggleCalendarDeparture(opened,undefined,[],'09:00',false);
  assert.deepEqual(closed.departures['09:00'],original.departures['09:00']);
});
