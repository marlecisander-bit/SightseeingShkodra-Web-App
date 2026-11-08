import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toggleCalendarDeparture } from '../../src/app/admin/calendar-editing.ts';

test('reopening one time on a closed day retains all other closures and agreed editor overrides', () => {
  const original = {closed:true,times:[{time:'09:00'},{time:'11:00'}],prices:{adult:1200},departures:{'09:00':{capacity:6},'11:00':{prices:{child:500}}}};
  const next = toggleCalendarDeparture(original,undefined,[{time:'09:00'},{time:'11:00'}],'11:00',true);
  assert.equal(next.closed,false);
  assert.deepEqual(next.departures,{'09:00':{capacity:6,closed:true},'11:00':{prices:{child:500},closed:false}});
  assert.deepEqual(next.prices,original.prices);
  assert.equal(original.closed,true);
  assert.equal(original.departures['09:00'].closed,undefined);
});
test('retired times cannot be reopened; existing product times never create a copied list', () => {
 const original={departures:{'09:00':{closed:true,capacity:8}}};
 assert.equal(toggleCalendarDeparture(original,undefined,[{time:'11:00'}],'09:00',true),original);
 const opened=toggleCalendarDeparture(original,undefined,[{time:'09:00'}],'09:00',true);
 assert.equal(opened.departures['09:00'].closed,false);
 assert.equal(opened.times,undefined);
 assert.equal(toggleCalendarDeparture(opened,undefined,[{time:'09:00'}],'09:00',false).departures['09:00'].capacity,8);
});
