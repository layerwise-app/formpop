import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_MS,
  fillDays,
  funnelRates,
  npsScore,
  summarizeField,
  sumDays
} from '../src/lib/form-analytics.ts';
import { newField } from '../src/lib/form-model.ts';

test('NPS counts promoters minus detractors', () => {
  assert.equal(npsScore([]), 0);
  assert.equal(npsScore([10, 9, 8, 7, 0]), 20);
  assert.equal(npsScore([0, 6, 6]), -100);
  assert.equal(npsScore([9, 10]), 100);
});

test('choice summaries keep option order and renamed values', () => {
  const field = { ...newField('multiple_choice'), options: ['A', 'B', 'C'] };
  const summary = summarizeField(field, [['A', 'B'], ['B'], undefined, ['Old']]);
  assert.equal(summary.kind, 'choice');
  assert.equal(summary.answered, 3);
  assert.deepEqual(
    summary.rows.map((r) => [r.label, r.count]),
    [['A', 1], ['B', 2], ['C', 0], ['Old', 1]]
  );
  assert.equal(summary.rows[1].share, 2 / 3);
});

test('rating and opinion scale summaries average answered values', () => {
  const rating = summarizeField(newField('rating'), ['5', '4', '', undefined, '3']);
  assert.equal(rating.kind, 'rating');
  assert.equal(rating.answered, 3);
  assert.equal(rating.average, 4);
  assert.equal(rating.rows.length, 5);

  const scale = summarizeField(newField('opinion_scale'), ['10', '9', '7', '3']);
  assert.equal(scale.kind, 'scale');
  assert.equal(scale.nps, 25);
  assert.deepEqual([scale.promoters, scale.passives, scale.detractors], [2, 1, 1]);
  assert.equal(scale.rows.length, 11);

  const yesNo = summarizeField(newField('yes_no'), ['Yes', 'No', 'Yes']);
  assert.deepEqual(yesNo.rows.map((r) => r.count), [2, 1]);
});

test('text summaries keep the newest five answers', () => {
  const answers = ['f', 'e', '  ', 'd', 'c', 'b', 'a'];
  const summary = summarizeField(newField('long_text'), answers);
  assert.deepEqual(summary.recent, ['f', 'e', 'd', 'c', 'b']);
  assert.equal(summary.answered, 6);
});

test('funnel rates handle empty and inconsistent counts', () => {
  assert.deepEqual(funnelRates({ views: 0, starts: 0, completions: 0 }), {
    startRate: null,
    completionRate: null,
    conversion: null
  });
  assert.deepEqual(funnelRates({ views: 10, starts: 4, completions: 3 }), {
    startRate: 40,
    completionRate: 75,
    conversion: 30
  });
  // Completions can exceed tracked starts when tracking was blocked.
  assert.equal(funnelRates({ views: 1, starts: 1, completions: 2 }).completionRate, 100);
});

test('daily series fill gaps and end today', () => {
  const now = 20_000 * DAY_MS + 5_000;
  const series = fillDays([{ day: 19_999, views: 3, starts: 2, completions: 1 }], 7, now);
  assert.equal(series.length, 7);
  assert.equal(series.at(-1).day, 20_000);
  assert.equal(series[0].day, 19_994);
  assert.deepEqual(sumDays(series), { views: 3, starts: 2, completions: 1 });
});
