import assert from 'node:assert/strict';
import { test } from 'node:test';
import { navigationFor } from '../../src/modules/identity/admin-navigation.ts';
test('admin navigation matches the intended role workspaces', () => {
  assert.deepEqual(navigationFor('content_editor').map(item=>item.slug), ['more','overview','products','route-stops','partners','reviews','content']);
  assert.deepEqual(navigationFor('operations').map(item=>item.slug), ['notifications','more','overview','products','departures','bookings']);
  assert.equal(navigationFor('owner').length,12);
  assert.equal(navigationFor('admin').length,11);
});

test('Route stops sign-in return remains internal and rejects arbitrary query parameters',async()=>{
 const {safeAdminReturn}=await import('../../src/modules/notifications/contracts.ts');
 const path='/admin/10000000-0000-4000-8000-000000000001/route-stops';
 assert.equal(safeAdminReturn(path),path);
 assert.equal(safeAdminReturn(path+'?next=https://example.com'),'/admin');
 assert.equal(safeAdminReturn('https://example.com'+path),'/admin');
});
