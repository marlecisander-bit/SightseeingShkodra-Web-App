import assert from 'node:assert/strict';
import { test } from 'node:test';
import { navigationFor } from '../../src/modules/identity/admin-navigation.ts';
test('admin navigation matches the intended role workspaces', () => {
  assert.deepEqual(navigationFor('content_editor').map(item=>item.slug), ['overview','reviews','content']);
  assert.deepEqual(navigationFor('operations').map(item=>item.slug), ['overview','departures','bookings']);
  assert.equal(navigationFor('owner').length,6);
  assert.equal(navigationFor('admin').length,6);
});
