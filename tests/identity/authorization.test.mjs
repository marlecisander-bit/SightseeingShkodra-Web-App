import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authorizeStaff, AuthorizationError } from '../../src/modules/identity/authorization.ts';
import { hasPermission, staffRoles, permissions } from '../../src/modules/identity/roles.ts';
import { operatorId, staffFixtures } from '../fixtures/staff.mjs';

const sourceFor = (membership) => ({
  getVerifiedUser: async () => ({ id: membership.auth_user_id }),
  getMembership: async () => membership,
});
const denied = (code) => (error) => error instanceof AuthorizationError && error.code === code;

test('fixtures cover every canonical role and grant its intended work', async () => {
  assert.deepEqual(staffFixtures.map((f) => f.role), [...staffRoles]);
  for (const [index, permission] of ['staff.manage', 'payments.refund', 'bookings.create', 'content.manage'].entries()) {
    const fixture = staffFixtures[index];
    const context = await authorizeStaff(sourceFor(fixture), operatorId, permission);
    assert.equal(context.role, fixture.role);
    assert.equal(context.staffProfileId, fixture.id);
    assert(Object.isFrozen(context));
  }
});

test('owner alone controls staff, operator settings and integrations', () => {
  for (const permission of ['staff.manage', 'operator.manage', 'integrations.manage']) {
    assert(hasPermission('owner', permission));
    for (const role of ['admin', 'operations', 'content_editor']) assert(!hasPermission(role, permission));
  }
  assert(permissions.every((permission) => hasPermission('owner', permission)));
});

test('operations cannot refund, change product pricing or edit content; editors cannot access customers', async () => {
  for (const permission of ['payments.refund', 'catalog.manage', 'content.manage']) {
    await assert.rejects(authorizeStaff(sourceFor(staffFixtures[2]), operatorId, permission), denied('FORBIDDEN'));
  }
  for (const permission of ['customers.read', 'bookings.read', 'tracking.manage']) {
    await assert.rejects(authorizeStaff(sourceFor(staffFixtures[3]), operatorId, permission), denied('FORBIDDEN'));
  }
});

test('no verified identity means no membership query or access', async () => {
  await assert.rejects(authorizeStaff({
    getVerifiedUser: async () => null,
    getMembership: async () => { assert.fail('must not query memberships'); },
  }, operatorId, 'catalog.read'), denied('UNAUTHENTICATED'));
});

test('wrong user, wrong operator, missing, disabled or unknown-role memberships fail closed', async () => {
  const owner = staffFixtures[0];
  for (const membership of [null, { ...owner, is_active: false }, { ...owner, role: 'superadmin' },
    { ...owner, auth_user_id: staffFixtures[1].auth_user_id }, { ...owner, operator_id: staffFixtures[1].id }]) {
    await assert.rejects(authorizeStaff({
      getVerifiedUser: async () => ({ id: owner.auth_user_id }), getMembership: async () => membership,
    }, operatorId, 'catalog.read'), denied('FORBIDDEN'));
  }
});

test('user-editable metadata cannot promote a content editor', async () => {
  const editor = staffFixtures[3];
  await assert.rejects(authorizeStaff({
    getVerifiedUser: async () => ({ id: editor.auth_user_id, user_metadata: { role: 'owner' } }),
    getMembership: async () => editor,
  }, operatorId, 'staff.manage'), denied('FORBIDDEN'));
});

test('membership is reread on every request so demotion is effective without a new session', async () => {
  let membership = { ...staffFixtures[0] };
  const source = { getVerifiedUser: async () => ({ id: membership.auth_user_id }), getMembership: async () => membership };
  await authorizeStaff(source, operatorId, 'staff.manage');
  membership = { ...membership, role: 'operations' };
  await assert.rejects(authorizeStaff(source, operatorId, 'staff.manage'), denied('FORBIDDEN'));
});

test('provider/database failures expose no internal detail and never allow access', async () => {
  for (const failAt of ['getVerifiedUser', 'getMembership']) {
    const source = sourceFor(staffFixtures[0]);
    source[failAt] = async () => { throw new Error('private provider response'); };
    await assert.rejects(authorizeStaff(source, operatorId, 'catalog.read'), (error) => {
      assert.equal(error.message.includes('private provider response'), false);
      return denied('UNAVAILABLE')(error);
    });
  }
});

test('invalid operator IDs are rejected before reaching auth services', async () => {
  const source = { getVerifiedUser: async () => { assert.fail('must not call'); }, getMembership: async () => null };
  await assert.rejects(authorizeStaff(source, 'invalid', 'catalog.read'), denied('FORBIDDEN'));
});
