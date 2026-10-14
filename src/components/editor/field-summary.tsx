import { Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import type { CountRow, FieldSummary } from '~/lib/form-analytics';
import type { FormField } from '~/lib/form-model';
import { cn } from '~/lib/utils';
import { fieldIcons } from './field-icons';

const percent = (share: number) => `${Math.round(share * 100)}%`;
const oneDecimal = (value: number) => value.toFixed(1).replace(/\.0$/, '');

function Bars({ rows }: { rows: CountRow[] }) {
  const top = Math.max(...rows.map((r) => r.count));
  return (
    <ul className='flex flex-col gap-2.5'>
      {rows.map((row) => (
        <li key={row.label} className='grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1 text-sm'>
          <span className='truncate'>{row.label}</span>
          <span className='text-muted-foreground tabular-nums'>
            {row.count} · {percent(row.share)}
          </span>
          <span className='col-span-2 h-2 overflow-hidden rounded-full bg-muted'>
            <span
              className={cn(
                'block h-full rounded-full transition-[width] duration-500',
                row.count === top && top > 0 ? 'bg-primary' : 'bg-chart-2'
              )}
              style={{ width: percent(row.share) }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

// Vertical distribution for fixed numeric scales (1–5 and 0–10).
function Columns({ rows }: { rows: CountRow[] }) {
  const top = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className='flex h-28 items-end gap-1' role='img' aria-label='Answer distribution'>
      {rows.map((row) => (
        <div key={row.label} className='flex flex-1 flex-col items-center gap-1'>
          <span className='flex h-20 w-full items-end'>
            <span
              title={`${row.label}: ${row.count}`}
              className='w-full rounded-t-md bg-primary/80'
              style={{ height: `${Math.max(row.count ? 6 : 2, (row.count / top) * 100)}%`, opacity: row.count ? 1 : 0.25 }}
            />
          </span>
          <span className='text-[0.7rem] text-muted-foreground tabular-nums'>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function Metric({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={className}>
      <div className='font-display text-3xl tabular-nums'>{value}</div>
      <div className='text-xs text-muted-foreground'>{label}</div>
    </div>
  );
}

function SummaryBody({ summary }: { summary: FieldSummary }) {
  if (!summary.answered) {
    return <p className='text-sm text-muted-foreground'>No answers in this period.</p>;
  }
  switch (summary.kind) {
    case 'choice':
      return <Bars rows={summary.rows} />;
    case 'rating':
      return (
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-3'>
            <Metric value={oneDecimal(summary.average)} label='Average of 5' />
            <span className='flex gap-0.5 text-primary' aria-hidden='true'>
              {[1, 2, 3, 4, 5].map((n) => (
                // A clipped filled star over the outline shows fractional averages like 4.5.
                <span key={n} className='relative size-4'>
                  <Star className='size-4' />
                  <span
                    className='absolute inset-y-0 left-0 overflow-hidden'
                    style={{ width: `${Math.min(Math.max(summary.average - n + 1, 0), 1) * 100}%` }}
                  >
                    <Star className='size-4 fill-current' />
                  </span>
                </span>
              ))}
            </span>
          </div>
          <Columns rows={summary.rows} />
        </div>
      );
    case 'scale': {
      const total = summary.answered;
      const groups = [
        { label: 'Detractors', count: summary.detractors, className: 'bg-chart-3' },
        { label: 'Passives', count: summary.passives, className: 'bg-chart-4' },
        { label: 'Promoters', count: summary.promoters, className: 'bg-primary' }
      ];
      return (
        <div className='flex flex-col gap-4'>
          <div className='flex gap-8'>
            <Metric value={summary.nps > 0 ? `+${summary.nps}` : String(summary.nps)} label='NPS' />
            <Metric value={oneDecimal(summary.average)} label='Average of 10' />
          </div>
          <div>
            <div className='flex h-2 overflow-hidden rounded-full bg-muted'>
              {groups.map((g) =>
                g.count ? (
                  <span key={g.label} className={g.className} style={{ width: percent(g.count / total) }} />
                ) : null
              )}
            </div>
            <ul className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
              {groups.map((g) => (
                <li key={g.label} className='flex items-center gap-1.5'>
                  <span className={cn('size-2 rounded-full', g.className)} />
                  {g.label} {percent(g.count / total)}
                </li>
              ))}
            </ul>
          </div>
          <Columns rows={summary.rows} />
        </div>
      );
    }
    case 'number':
      return (
        <div className='flex gap-8'>
          <Metric value={oneDecimal(summary.average)} label='Average' />
          <Metric value={String(summary.min)} label='Lowest' />
          <Metric value={String(summary.max)} label='Highest' />
        </div>
      );
    case 'text':
      return (
        <ul className='flex flex-col divide-y'>
          {summary.recent.map((text, i) => (
            <li key={i} className='line-clamp-3 py-2 text-sm first:pt-0 last:pb-0'>
              {text}
            </li>
          ))}
        </ul>
      );
  }
}

export function FieldSummaryCard({
  field,
  number,
  summary
}: {
  field: FormField;
  number: number;
  summary: FieldSummary;
}) {
  const Icon = fieldIcons[field.type];
  return (
    <Card className='gap-4'>
      <CardHeader>
        <CardDescription className='flex items-center gap-1.5'>
          <Icon className='size-3.5' />
          Question {number}
          <span className='ml-auto tabular-nums'>
            {summary.answered} {summary.answered === 1 ? 'answer' : 'answers'}
          </span>
        </CardDescription>
        <CardTitle className='font-display text-lg leading-snug font-normal'>{field.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <SummaryBody summary={summary} />
      </CardContent>
    </Card>
  );
}
