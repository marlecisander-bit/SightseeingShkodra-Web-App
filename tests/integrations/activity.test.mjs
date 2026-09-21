import assert from 'node:assert/strict';
import { test } from 'node:test';
import { persistStaffActivity, ActivityPersistenceError } from '../../src/modules/integrations/activity.ts';

const context = { userId: 'verified-user', operatorId: 'verified-operator', staffProfileId: 'verified-staff', role: 'owner' };
const activity = {
  idempotencyKey: 'request-1', entityType: 'product', entityId: 'product-1',
  eventType: 'product.changed', payload: { changedFields: ['title'] },
  action: 'updated', metadata: { changedFields: ['title'] },
};

test('activity RPC uses verified operator/actor and a single atomic persistence call', async () => {
  let calls = 0;
  const client = { rpc: async (name, args) => {
    calls++;
    assert.equal(name, 'record_domain_activity');
    assert.equal(args.p_operator_id, context.operatorId);
    assert.equal(args.p_actor_id, context.staffProfileId);
    assert.equal(args.p_idempotency_key, activity.idempotencyKey);
    assert.equal(args.p_schema_version, 1);
    assert.deepEqual(args.p_payload, activity.payload);
    assert.deepEqual(args.p_metadata, activity.metadata);
    return { data: [{ event_id: 'event', audit_id: 'audit' }], error: null };
  } };
  const result = await persistStaffActivity(client, context, { ...activity, operatorId: 'forged', actorId: 'forged' });
  assert.deepEqual(result, { eventId: 'event', auditId: 'audit' });
  assert.equal(calls, 1);
});

test('explicit event schema version is forwarded without rewriting caller payload', async () => {
  const client = { rpc: async (_name, args) => {
    assert.equal(args.p_schema_version, 2);
    return { data: [{ event_id: 'event', audit_id: 'audit' }], error: null };
  } };
  await persistStaffActivity(client, context, { ...activity, schemaVersion: 2 });
});

test('database errors cannot leak internal messages or submitted data', async () => {
  const client = { rpc: async () => ({ data: null, error: { message: 'private database payload' } }) };
  await assert.rejects(persistStaffActivity(client, context, activity), (error) => {
    assert(!error.message.includes('private database payload'));
    return error instanceof ActivityPersistenceError;
  });
});

test('empty, multiple or malformed RPC results are not reported as persisted', async () => {
  for (const data of [null, [], [{ event_id: 'only-event' }], [{ event_id: 1, audit_id: 'audit' }],
    [{ event_id: 'e', audit_id: 'a' }, { event_id: 'e2', audit_id: 'a2' }]]) {
    await assert.rejects(persistStaffActivity({ rpc: async () => ({ data, error: null }) }, context, activity), ActivityPersistenceError);
  }
});

test('network exceptions fail without exposing provider details', async () => {
  await assert.rejects(persistStaffActivity({ rpc: async () => { throw new Error('private network detail'); } }, context, activity),
    (error) => error instanceof ActivityPersistenceError && !error.message.includes('private network detail'));
});
