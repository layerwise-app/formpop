import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Segmented } from '~/components/segmented';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '~/components/ui/chart';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '~/components/ui/empty';
import { Skeleton } from '~/components/ui/skeleton';
import {
  DAY_MS,
  dayIndex,
  fillDays,
  funnelRates,
  summarizeField,
  sumDays
} from '~/lib/form-analytics';
import { useEditor } from './editor-state';
import { FieldSummaryCard } from './field-summary';
import { analyticsQuery, responsesQuery } from './queries';

const ranges = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' }
] as const;
type Range = (typeof ranges)[number]['value'];

const chartConfig = {
  views: { label: 'Views', color: 'var(--chart-4)' },
  completions: { label: 'Responses', color: 'var(--chart-1)' }
} satisfies ChartConfig;

// Days are UTC buckets, so label them in UTC too.
const dayLabel = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
});
const formatDay = (day: number) => dayLabel.format(day * DAY_MS);

function FunnelStep({
  label,
  value,
  width,
  rate,
  rateLabel
}: {
  label: string;
  value: number;
  width: number;
  rate?: number | null;
  rateLabel?: string;
}) {
  return (
    <div className='flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4'>
      <div className='flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2'>
        <span className='text-sm text-muted-foreground'>{label}</span>
        {rateLabel ? (
          <span className='text-xs text-muted-foreground tabular-nums'>
            {rate === null ? '—' : `${rate}%`} {rateLabel}
          </span>
        ) : null}
      </div>
      <span className='truncate font-display text-3xl tabular-nums sm:text-4xl'>{value.toLocaleString()}</span>
      <span className='h-1.5 overflow-hidden rounded-full bg-muted'>
        <span
          className='block h-full rounded-full bg-primary transition-[width] duration-700'
          style={{ width: `${width}%` }}
        />
      </span>
    </div>
  );
}

export function AnalyticsPanel() {
  const { saved, document } = useEditor();
  const [range, setRange] = useState<Range>('30');
  const days = Number(range);
  const analytics = useQuery({
    ...analyticsQuery(saved.id, days),
    placeholderData: keepPreviousData
  });
  const responses = useQuery(responsesQuery(saved.id));

  const header = (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <h2 className='font-display text-2xl'>Analytics</h2>
      <Segmented value={range} onChange={setRange} options={ranges} label='Date range' size='sm' />
    </div>
  );

  if (analytics.isError || responses.isError) {
    return (
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6'>
        {header}
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Couldn’t load analytics</EmptyTitle>
            <EmptyDescription>
              {(analytics.error ?? responses.error)?.message}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant='outline'
              onClick={() => {
                void analytics.refetch();
                void responses.refetch();
              }}
            >
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (!analytics.data || !responses.data) {
    return (
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6'>
        {header}
        <div className='grid grid-cols-3 gap-2 sm:gap-3'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-32 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-72 rounded-xl' />
      </div>
    );
  }

  const { now, daily } = analytics.data;
  const series = fillDays(daily, days, now);
  const totals = sumDays(series);
  const rates = funnelRates(totals);
  const since = (dayIndex(now) - days + 1) * DAY_MS;
  const inRange = responses.data.filter((r) => r.createdAt >= since);
  const widthOf = (n: number) => (totals.views ? Math.min(100, (n / totals.views) * 100) : 0);

  return (
    <div
      className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 transition-opacity sm:px-6 data-[stale=true]:opacity-60'
      data-stale={analytics.isPlaceholderData}
    >
      {header}

      <section aria-label='Funnel' className='flex flex-col gap-2'>
        <div className='grid grid-cols-3 gap-2 sm:gap-3'>
          <FunnelStep label='Views' value={totals.views} width={totals.views ? 100 : 0} />
          <FunnelStep
            label='Started'
            value={totals.starts}
            width={widthOf(totals.starts)}
            rate={rates.startRate}
            rateLabel='of views'
          />
          <FunnelStep
            label='Completed'
            value={totals.completions}
            width={widthOf(totals.completions)}
            rate={rates.completionRate}
            rateLabel='of starts'
          />
        </div>
        <p className='text-xs text-muted-foreground'>
          Each browser session counts once. No personal data is stored.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Views and responses</CardTitle>
          <CardDescription>
            {rates.conversion === null
              ? 'No views in this period yet.'
              : `${rates.conversion}% of views became responses.`}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-2 sm:px-4'>
          <ChartContainer config={chartConfig} className='aspect-auto h-64 w-full'>
            <AreaChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id='fill-completions' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--color-completions)' stopOpacity={0.3} />
                  <stop offset='100%' stopColor='var(--color-completions)' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='day'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={formatDay}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator='dot'
                    labelFormatter={(_, payload) => formatDay(Number(payload[0]?.payload.day))}
                  />
                }
              />
              <Area
                dataKey='views'
                type='monotone'
                stroke='var(--color-views)'
                strokeWidth={2}
                fill='transparent'
              />
              <Area
                dataKey='completions'
                type='monotone'
                stroke='var(--color-completions)'
                strokeWidth={2}
                fill='url(#fill-completions)'
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <section aria-labelledby='question-summary' className='flex flex-col gap-3'>
        <div className='flex items-baseline justify-between gap-2'>
          <h3 id='question-summary' className='font-display text-xl'>
            Answers by question
          </h3>
          <span className='text-sm text-muted-foreground tabular-nums'>
            {inRange.length} {inRange.length === 1 ? 'response' : 'responses'}
          </span>
        </div>
        <div className='grid gap-3 md:grid-cols-2'>
          {document.fields.map((field, i) => (
            <FieldSummaryCard
              key={field.id}
              field={field}
              number={i + 1}
              summary={summarizeField(field, inRange.map((r) => r.answers[field.id]))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
