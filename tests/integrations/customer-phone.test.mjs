import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCustomerPhone} from '../../src/modules/booking/customer-phone.ts';
test('public contact requires an international number and normalizes formatting',()=>{
 for(const value of [undefined,null,'','0691234567','00355691234567','+012345678','+355','+355691234567 ext 2','+355691234567;alert(1)','+1234567890123456'])assert.equal(normalizeCustomerPhone(value),null,String(value));
 assert.equal(normalizeCustomerPhone(' +355 69 123 4567 '),'+355691234567');
 assert.equal(normalizeCustomerPhone('+44 (7700) 900-123'),'+447700900123');
 assert.equal(normalizeCustomerPhone('+1 202-555-0123'),'+12025550123');
});
