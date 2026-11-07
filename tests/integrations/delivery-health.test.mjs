import {test} from 'node:test';
import assert from 'node:assert/strict';
import {automaticBookingHealth} from '../../src/modules/notifications/delivery-health.ts';
test('automatic health needs fresh worker success as well as flags and activation, independent of registration',()=>{
 const now=Date.parse('2026-11-07T18:00:00Z'),input={pushEnabled:true,workerEnabled:true,paused:false,startValid:true};
 assert.equal(automaticBookingHealth(input,now).state,'Needs attention');
 const good={...input,worker:{status:'live',started_at:'2026-11-07T17:59:00Z',last_success_at:'2026-11-07T17:59:01Z'}};
 assert.equal(automaticBookingHealth(good,now).state,'Active');
 for(const change of [{queueIssue:true},{unavailable:true},{startValid:false},{pushEnabled:false},{worker:{...good.worker,status:'failed'}},{worker:{...good.worker,last_success_at:'2026-11-07T17:56:00Z'}},{worker:{...good.worker,last_success_at:'2026-11-07T18:01:00Z'}}])assert.equal(automaticBookingHealth({...good,...change},now).state,'Needs attention');
 assert.equal(automaticBookingHealth({...good,paused:true},now).state,'Paused');
 assert.equal(automaticBookingHealth({...good,workerEnabled:false},now).state,'Paused');
});
