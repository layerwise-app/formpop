import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  answerError,
  blankDocument,
  contrastRatio,
  csvCell,
  newField,
  readableOn,
  validateAnswers,
  validateDocument,
  visibleFields
} from '../src/lib/form-model.ts';
import { templateDocument, templateInfo, themePresets } from '../src/lib/form-templates.ts';

test('every template is a valid document', () => {
  for (const t of templateInfo) {
    const document = templateDocument(t.id);
    assert.equal(validateDocument(document).title, t.title);
    assert.equal(document.fields.length, t.questions);
  }
});

test('question types reject malformed public answers', () => {
  const cases = [
    ['short_text', ['not', 'text']],
    ['long_text', 'x'.repeat(10001)],
    ['email', 'bad-email'],
    ['number', 'Infinity'],
    ['number', 'hello'],
    ['date', '2026-02-30'],
    ['date', 'yesterday'],
    ['single_choice', 'invented'],
    ['multiple_choice', ['Option A', 'Option A']],
    ['multiple_choice', ['invented']],
    ['short_text', []],
    ['multiple_choice', ''],
    ['email', null],
    ['rating', '0'],
    ['rating', '6'],
    ['rating', '4.5'],
    ['rating', ['5']],
    ['opinion_scale', '11'],
    ['opinion_scale', '-1'],
    ['opinion_scale', '07'],
    ['yes_no', 'yes'],
    ['yes_no', 'Maybe']
  ];
  for (const [type, value] of cases) {
    assert.ok(answerError(newField(type), value), `${type}: ${value}`);
  }
  assert.equal(answerError(newField('email'), 'hello@example.com'), null);
  assert.equal(answerError(newField('number'), '-12.5'), null);
  assert.equal(answerError(newField('date'), '2028-02-29'), null);
  assert.equal(answerError(newField('rating'), '5'), null);
  assert.equal(answerError(newField('opinion_scale'), '0'), null);
  assert.equal(answerError(newField('opinion_scale'), '10'), null);
  assert.equal(answerError(newField('yes_no'), 'No'), null);
});

test('required answers and unknown field IDs are validated', () => {
  const document = blankDocument();
  document.fields[0].required = true;
  assert.throws(() => validateAnswers(document, {}), /Please answer/);
  assert.throws(() => validateAnswers(document, { fake: 'answer' }), /Unknown question/);
  assert.throws(
    () => validateAnswers(document, { [document.fields[0].id]: '   ' }),
    /Please answer/
  );
});

test('conditional visibility discards hidden answers and prevents hidden chaining', () => {
  const document = blankDocument();
  const first = document.fields[0];
  const second = newField('short_text');
  second.required = true;
  second.condition = { fieldId: first.id, value: 'yes' };
  const third = newField('email');
  third.required = true;
  third.condition = { fieldId: second.id, value: 'show' };
  document.fields.push(second, third);
  const answers = { [first.id]: 'no', [second.id]: 'show', [third.id]: 'not-an-email' };
  assert.deepEqual(visibleFields(document.fields, answers).map((f) => f.id), [first.id]);
  assert.deepEqual(validateAnswers(document, answers), { [first.id]: 'no' });
  assert.throws(() => validateAnswers(document, { [first.id]: 'yes' }), /Please answer/);
});

test('scale and yes/no answers drive conditions', () => {
  const document = blankDocument();
  const attending = newField('yes_no');
  attending.required = true;
  const guests = newField('number');
  guests.required = true;
  guests.condition = { fieldId: attending.id, value: 'Yes' };
  const score = newField('opinion_scale');
  const why = newField('long_text');
  why.condition = { fieldId: score.id, value: '0' };
  document.fields = [attending, guests, score, why];
  validateDocument(document);
  assert.throws(() => validateAnswers(document, { [attending.id]: 'Yes' }), /Please answer/);
  assert.deepEqual(validateAnswers(document, { [attending.id]: 'No', [guests.id]: '3' }), {
    [attending.id]: 'No'
  });
  assert.equal(visibleFields(document.fields, { [attending.id]: 'No', [score.id]: '0' }).length, 3);
});

test('multiple-choice conditions match any selected option', () => {
  const document = blankDocument();
  document.fields[0] = newField('multiple_choice');
  const followup = newField('long_text');
  followup.condition = { fieldId: document.fields[0].id, value: 'Option B' };
  document.fields.push(followup);
  const answers = { [document.fields[0].id]: ['Option A', 'Option B'] };
  assert.equal(visibleFields(document.fields, answers).length, 2);
});

test('documents reject duplicate fields, empty choices, forward rules and unsafe colors', () => {
  const original = blankDocument();
  const duplicate = structuredClone(original);
  duplicate.fields.push(duplicate.fields[0]);
  assert.throws(() => validateDocument(duplicate), /unique/);
  const rule = structuredClone(original);
  rule.fields[0].condition = { fieldId: 'future', value: 'yes' };
  assert.throws(() => validateDocument(rule), /earlier/);
  const choices = structuredClone(original);
  choices.fields[0].type = 'single_choice';
  assert.throws(() => validateDocument(choices), /Choices/);
  const color = structuredClone(original);
  color.theme.accent = 'url(javascript:bad)';
  assert.throws(() => validateDocument(color), /hex/);
  const type = structuredClone(original);
  type.fields[0].type = 'slider';
  assert.throws(() => validateDocument(type), /Unsupported/);
});

test('fixed-scale questions drop stray options', () => {
  const document = blankDocument();
  document.fields[0] = { ...newField('rating'), options: ['ignored'] };
  assert.deepEqual(validateDocument(document).fields[0].options, []);
});

test('CSV quotes values and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('He said "hello", again'), '"He said ""hello"", again"');
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell('  +1'), '"\'  +1"');
  assert.equal(csvCell('line one\nline two'), '"line one\nline two"');
});

test('button text stays readable on every preset accent', () => {
  assert.equal(readableOn('#ffffff'), '#1e1220');
  assert.equal(readableOn('#1f1d1a'), '#ffffff');
  for (const preset of themePresets) {
    validateDocument({ ...blankDocument(), theme: preset.theme });
    assert.match(readableOn(preset.theme.accent), /^#(ffffff|1e1220)$/);
  }
});

test('contrast ratio matches WCAG reference values', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21);
  assert.equal(contrastRatio('#e11d74', '#e11d74'), 1);
  assert.equal(contrastRatio('#ffffff', '#767676').toFixed(1), '4.5');
  for (const preset of themePresets) {
    assert.ok(contrastRatio(preset.theme.text, preset.theme.background) >= 7);
  }
});
