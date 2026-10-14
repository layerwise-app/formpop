import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newField } from '../src/lib/form-model.ts';
import { autoAdvances, keyAnswer } from '../src/lib/form-keys.ts';

test('letters pick and toggle choices', () => {
  const single = newField('single_choice');
  assert.equal(keyAnswer(single, 'b', undefined), 'Option B');
  assert.equal(keyAnswer(single, 'Z', undefined), null);
  const multiple = newField('multiple_choice');
  const once = keyAnswer(multiple, 'a', undefined);
  assert.deepEqual(once, ['Option A']);
  assert.deepEqual(keyAnswer(multiple, 'c', once), ['Option A', 'Option C']);
  assert.deepEqual(keyAnswer(multiple, 'a', once), []);
});

test('digits and initials answer fixed scales', () => {
  assert.equal(keyAnswer(newField('yes_no'), 'Y', undefined), 'Yes');
  assert.equal(keyAnswer(newField('yes_no'), 'n', undefined), 'No');
  assert.equal(keyAnswer(newField('yes_no'), 'x', undefined), null);
  assert.equal(keyAnswer(newField('rating'), '4', undefined), '4');
  assert.equal(keyAnswer(newField('rating'), '6', undefined), null);
  const scale = newField('opinion_scale');
  assert.equal(keyAnswer(scale, '0', undefined), '0');
  assert.equal(keyAnswer(scale, '0', '1', true), '10');
  assert.equal(keyAnswer(scale, '0', '1', false), '0');
  assert.equal(keyAnswer(newField('short_text'), 'a', undefined), null);
});

test('only single-value fields auto advance', () => {
  assert.equal(autoAdvances(newField('rating')), true);
  assert.equal(autoAdvances(newField('yes_no')), true);
  assert.equal(autoAdvances(newField('multiple_choice')), false);
  assert.equal(autoAdvances(newField('long_text')), false);
});
