import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankDocument, newField, validateDocument } from '../src/lib/form-model.ts';
import {
  changeFieldType,
  duplicateField,
  insertField,
  moveField,
  removeField,
  setOptions
} from '../src/lib/form-edits.ts';

function withRule() {
  const doc = blankDocument('Rules');
  const pick = newField('single_choice', 'Pick');
  const follow = { ...newField('short_text', 'Why?'), condition: { fieldId: pick.id, value: 'Option B' } };
  return { doc: { ...doc, fields: [pick, follow] }, pick, follow };
}

test('insert places a question after the selected one', () => {
  const doc = blankDocument();
  const first = doc.fields[0];
  const a = newField('email');
  const b = newField('number');
  const next = insertField(insertField(doc, a), b, first.id);
  assert.deepEqual(next.fields.map((f) => f.id), [first.id, b.id, a.id]);
});

test('moves cannot place a question before its rule source', () => {
  const { doc } = withRule();
  assert.equal(moveField(doc, 1, 0), null);
  assert.equal(moveField(doc, 0, 0), null);
  const free = { ...doc, fields: [doc.fields[0], { ...doc.fields[1], condition: null }] };
  assert.equal(moveField(free, 1, 0)?.fields[0].label, 'Why?');
});

test('removing a question clears rules that pointed at it', () => {
  const { doc, pick } = withRule();
  const next = removeField(doc, pick.id);
  assert.equal(next.fields.length, 1);
  assert.equal(next.fields[0].condition, null);
  assert.equal(removeField(next, next.fields[0].id).fields.length, 1);
});

test('duplicates get a fresh id right after the source', () => {
  const { doc, pick } = withRule();
  const result = duplicateField(doc, pick.id);
  assert.notEqual(result.copy.id, pick.id);
  assert.equal(result.document.fields[1].id, result.copy.id);
  validateDocument(result.document);
});

test('renaming and removing options keeps rules valid', () => {
  const { doc, pick, follow } = withRule();
  const renamed = setOptions(doc, pick.id, ['Option A', 'Bee', 'Option C']);
  assert.equal(renamed.fields[1].condition.value, 'Bee');
  const removed = setOptions(renamed, pick.id, ['Option A', 'Option C']);
  assert.equal(removed.fields.find((f) => f.id === follow.id).condition.value, 'Option A');
  validateDocument(removed);
});

test('changing type resets options and retargets rules', () => {
  const { doc, pick } = withRule();
  const yesNo = changeFieldType(doc, pick.id, 'yes_no');
  assert.deepEqual(yesNo.fields[0].options, []);
  assert.equal(yesNo.fields[1].condition.value, 'Yes');
  const text = changeFieldType(yesNo, pick.id, 'short_text');
  assert.equal(text.fields[1].condition.value, 'Yes');
  const choice = changeFieldType(text, pick.id, 'multiple_choice');
  assert.equal(choice.fields[0].options.length, 3);
  assert.equal(choice.fields[1].condition.value, 'Option A');
  validateDocument(choice);
});
