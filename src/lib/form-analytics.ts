import {
  fixedValues,
  ratingValues,
  scaleValues,
  type Answer,
  type FormField
} from './form-model';

export const DAY_MS = 86_400_000;

export type CountRow = { label: string; count: number; share: number };
export type FieldSummary =
  | { kind: 'choice'; answered: number; rows: CountRow[] }
  | { kind: 'rating'; answered: number; average: number; rows: CountRow[] }
  | {
      kind: 'scale';
      answered: number;
      average: number;
      nps: number;
      promoters: number;
      passives: number;
      detractors: number;
      rows: CountRow[];
    }
  | { kind: 'number'; answered: number; average: number; min: number; max: number }
  | { kind: 'text'; answered: number; recent: string[] };

function present(answer: Answer | undefined): answer is Answer {
  if (answer === undefined) return false;
  return Array.isArray(answer) ? answer.length > 0 : answer.trim() !== '';
}

function countRows(values: string[], known: string[], answered: number) {
  const counts = new Map<string, number>(known.map((v) => [v, 0]));
  // Older responses may reference options that were renamed since.
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([label, count]) => ({
    label,
    count,
    share: answered ? count / answered : 0
  }));
}

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

// NPS: % promoters (9–10) minus % detractors (0–6), from -100 to 100.
export function npsScore(values: number[]) {
  if (!values.length) return 0;
  const promoters = values.filter((v) => v >= 9).length;
  const detractors = values.filter((v) => v <= 6).length;
  return Math.round(((promoters - detractors) / values.length) * 100);
}

// `answers` are ordered newest first, matching the responses list.
export function summarizeField(
  field: FormField,
  answers: (Answer | undefined)[]
): FieldSummary {
  const given = answers.filter(present);
  const answered = given.length;
  const flat = given.flatMap((a) => (Array.isArray(a) ? a : [a]));
  if (field.type === 'rating') {
    return {
      kind: 'rating',
      answered,
      average: average(flat.map(Number)),
      rows: countRows(flat, ratingValues, answered)
    };
  }
  if (field.type === 'opinion_scale') {
    const values = flat.map(Number);
    return {
      kind: 'scale',
      answered,
      average: average(values),
      nps: npsScore(values),
      promoters: values.filter((v) => v >= 9).length,
      passives: values.filter((v) => v === 7 || v === 8).length,
      detractors: values.filter((v) => v <= 6).length,
      rows: countRows(flat, scaleValues, answered)
    };
  }
  const fixed = fixedValues(field);
  if (fixed) return { kind: 'choice', answered, rows: countRows(flat, fixed, answered) };
  if (field.type === 'number') {
    const values = flat.map(Number).filter(Number.isFinite);
    return {
      kind: 'number',
      answered,
      average: average(values),
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0
    };
  }
  return { kind: 'text', answered, recent: flat.slice(0, 5) };
}

export type FunnelTotals = { views: number; starts: number; completions: number };
export type DailyCounts = FunnelTotals & { day: number };

function rate(part: number, whole: number) {
  return whole ? Math.min(100, Math.round((part / whole) * 100)) : null;
}

export function funnelRates({ views, starts, completions }: FunnelTotals) {
  return {
    startRate: rate(starts, views),
    completionRate: rate(completions, starts),
    conversion: rate(completions, views)
  };
}

export function dayIndex(timestamp: number) {
  return Math.floor(timestamp / DAY_MS);
}

// Expands sparse per-day rows into a continuous series ending today (UTC days).
export function fillDays(rows: DailyCounts[], days: number, now: number) {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const today = dayIndex(now);
  return Array.from({ length: days }, (_, i) => {
    const day = today - days + 1 + i;
    return byDay.get(day) ?? { day, views: 0, starts: 0, completions: 0 };
  });
}

export function sumDays(rows: DailyCounts[]): FunnelTotals {
  return rows.reduce(
    (total, r) => ({
      views: total.views + r.views,
      starts: total.starts + r.starts,
      completions: total.completions + r.completions
    }),
    { views: 0, starts: 0, completions: 0 }
  );
}
