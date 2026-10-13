import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerError, blankDocument, csvCell, newField, templateDocument, templateInfo, validateAnswers, validateDocument, visibleFields } from '../src/lib/form-model.ts';

test('every original template is a valid document', () => {
  for (const t of templateInfo) {
    const document = templateDocument(t.id);
    assert.equal(validateDocument(document).title, t.title);
    assert.equal(document.fields.length, t.questions);
  }
});
test('question types reject malformed public answers', () => {
  const cases = [
    ['short_text', ['not', 'text']], ['long_text', 'x'.repeat(10001)], ['email', 'bad-email'],
    ['number', 'Infinity'], ['number', 'hello'], ['date', '2026-02-30'], ['date', 'yesterday'],
    ['single_choice', 'invented'], ['multiple_choice', ['Option one', 'Option one']], ['multiple_choice', ['invented']],
    ['short_text', []], ['multiple_choice', ''], ['email', null],
  ];
  for (const [type, value] of cases) assert.ok(answerError(newField(type), value), `${type}: ${value}`);
  assert.equal(answerError(newField('email'), 'hello@example.com'), null);
  assert.equal(answerError(newField('number'), '-12.5'), null);
  assert.equal(answerError(newField('date'), '2028-02-29'), null);
});
test('required answers and unknown field IDs are validated', () => {
  const document = blankDocument(); document.fields[0].required = true;
  assert.throws(() => validateAnswers(document, {}), /Please answer/);
  assert.throws(() => validateAnswers(document, { fake: 'answer' }), /Unknown question/);
  assert.throws(() => validateAnswers(document, { [document.fields[0].id]: '   ' }), /Please answer/);
});
test('conditional visibility discards hidden answers and prevents hidden chaining', () => {
  const document = blankDocument();
  const first = document.fields[0];
  const second = newField('short_text'); second.required = true; second.condition = { fieldId: first.id, value: 'yes' };
  const third = newField('email'); third.required = true; third.condition = { fieldId: second.id, value: 'show' };
  document.fields.push(second, third);
  const answers = { [first.id]: 'no', [second.id]: 'show', [third.id]: 'not-an-email' };
  assert.deepEqual(visibleFields(document.fields, answers).map((f) => f.id), [first.id]);
  assert.deepEqual(validateAnswers(document, answers), { [first.id]: 'no' });
  assert.throws(() => validateAnswers(document, { [first.id]: 'yes' }), /Please answer/);
});
test('multiple-choice conditions match any selected option', () => {
  const document = blankDocument(); document.fields[0] = newField('multiple_choice');
  const followup = newField('long_text'); followup.condition = { fieldId: document.fields[0].id, value: 'Option two' }; document.fields.push(followup);
  assert.equal(visibleFields(document.fields, { [document.fields[0].id]: ['Option one', 'Option two'] }).length, 2);
});
test('documents reject duplicate fields, empty choices, forward rules and unsafe colors', () => {
  const original = blankDocument();
  const duplicate = structuredClone(original); duplicate.fields.push(duplicate.fields[0]); assert.throws(() => validateDocument(duplicate), /unique/);
  const rule = structuredClone(original); rule.fields[0].condition = { fieldId: 'future', value: 'yes' }; assert.throws(() => validateDocument(rule), /earlier/);
  const choices = structuredClone(original); choices.fields[0].type = 'single_choice'; assert.throws(() => validateDocument(choices), /Choices/);
  const color = structuredClone(original); color.theme.accent = 'url(javascript:bad)'; assert.throws(() => validateDocument(color), /hex/);
});
test('CSV quotes values and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('He said "hello", again'), '"He said ""hello"", again"');
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell('  +1'), '"\'  +1"');
  assert.equal(csvCell('line one\nline two'), '"line one\nline two"');
});
