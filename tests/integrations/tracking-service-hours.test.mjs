import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTrackingWeek, trackingWeekFromForm } from '../../src/modules/tracking/service-hours.ts';

test('tracking hours preserve Monday-first ordering, closed days, and overnight hours', () => {
  const form = new FormData();
  form.set('day-0', 'on');
  form.set('open-0', '22:00');
  form.set('close-0', '04:00');
  form.set('open-4', '08:00');
  assert.deepEqual(trackingWeekFromForm(form), [{ open: '22:00', close: '04:00' }, ...Array(6).fill(null)]);
});

test('rejects invalid or incomplete times on any selected day', () => {
  const form = new FormData();
  form.set('day-6', 'on');
  form.set('open-6', '09:00');
  assert.equal(trackingWeekFromForm(form), null);
  form.set('close-6', '09:00');
  assert.equal(trackingWeekFromForm(form), null);
  form.set('close-6', '24:00');
  assert.equal(trackingWeekFromForm(form), null);
  assert.equal(parseTrackingWeek(Array(6).fill(null)), null);
});
