import type { CSSProperties } from 'react';
import { ArrowRight, Flag, GitBranch } from 'lucide-react';
import { fieldIcons } from '~/components/editor/field-icons';
import { fieldTypes, typeLabels, type FieldType } from '~/lib/form-model';
import { cn } from '~/lib/utils';

// Static slices of the real editor, logic settings and analytics, drawn with
// the same tokens and icons. Decorative only: hidden from assistive tech.

const panel = 'rounded-2xl border bg-card shadow-[0_18px_40px_-28px_rgb(30_18_32/0.35)]';

const listed: { type: FieldType; label: string }[] = [
  { type: 'rating', label: 'How would you rate your visit?' },
  { type: 'multiple_choice', label: 'What did you try?' },
  { type: 'long_text', label: 'Anything we could do better?' }
];

export function EditorFragment() {
  return (
    <div aria-hidden className='flex flex-col'>
      <ol className={cn(panel, 'flex flex-col gap-0.5 p-2 sm:mr-20')}>
        {listed.map(({ type, label }, i) => {
          const Icon = fieldIcons[type];
          const active = i === 0;
          return (
            <li
              key={type}
              className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm', active && 'bg-tint')}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {i + 1}
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block truncate font-medium'>{label}</span>
                <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Icon className='size-3' />
                  {typeLabels[type]}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className={cn(panel, 'relative -mt-4 ml-6 p-2 sm:ml-24')}>
        <p className='px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground'>Add a question</p>
        <ul className='grid grid-cols-2 gap-0.5'>
          {fieldTypes.map((type) => {
            const Icon = fieldIcons[type];
            return (
              <li
                key={type}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                  type === 'opinion_scale' && 'bg-accent'
                )}
              >
                <Icon className='size-4 text-muted-foreground' />
                <span className='truncate'>{typeLabels[type]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Connector({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className='relative ml-8 h-12 border-l-2 border-dashed border-primary/35'>
      <span
        className={cn(
          'absolute top-1/2 left-4 -translate-y-1/2 rounded-full px-2.5 py-0.5 text-xs font-medium',
          muted ? 'bg-muted text-muted-foreground' : 'bg-tint text-secondary-foreground'
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function LogicFragment() {
  return (
    <div aria-hidden className='mx-auto flex w-full max-w-md flex-col'>
      <div className={cn(panel, 'p-5')}>
        <p className='flex items-center gap-1 text-xs font-semibold text-primary'>
          1 <ArrowRight className='size-3' />
        </p>
        <p className='mt-1 font-display text-xl'>Will you join us?</p>
        <div className='mt-4 flex gap-2'>
          {['Yes', 'No'].map((option) => (
            <span
              key={option}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm',
                option === 'Yes' ? 'border-primary bg-tint' : 'border-primary/30 bg-accent'
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded text-[0.6875rem] font-semibold',
                  option === 'Yes' ? 'bg-primary text-primary-foreground' : 'border border-primary/30 bg-card'
                )}
              >
                {option[0]}
              </span>
              {option}
            </span>
          ))}
        </div>
      </div>
      <Connector label='If Yes' />
      <div className={cn(panel, 'p-5')}>
        <p className='flex items-center gap-1 text-xs font-semibold text-primary'>
          2 <ArrowRight className='size-3' />
        </p>
        <p className='mt-1 font-display text-xl'>How many guests are you bringing?</p>
        <p className='mt-4 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground'>
          <GitBranch className='size-4 text-primary' />
          <span className='min-w-0 truncate'>
            Show when <span className='text-foreground'>Will you join us?</span> is{' '}
            <span className='text-foreground'>Yes</span>
          </span>
        </p>
      </div>
      <Connector label='If No' muted />
      <div className='flex items-center gap-3 rounded-2xl border border-dashed px-5 py-4 text-sm text-muted-foreground'>
        <Flag className='size-4' />
        Skips straight to the thank-you screen
      </div>
    </div>
  );
}

// Illustrative two weeks of traffic for the analytics fragment.
const days = [
  [42, 20],
  [51, 26],
  [47, 23],
  [63, 32],
  [58, 29],
  [71, 37],
  [66, 34],
  [80, 42],
  [74, 40],
  [92, 48],
  [86, 44],
  [101, 53],
  [95, 50],
  [112, 60]
];
const peak = Math.max(...days.map(([views]) => views));

const nps = [
  { label: 'Detractors', share: 12, className: 'bg-chart-5' },
  { label: 'Passives', share: 34, className: 'bg-chart-4' },
  { label: 'Promoters', share: 54, className: 'bg-primary' }
];

export function AnalyticsFragment() {
  return (
    <div aria-hidden className='flex flex-col gap-3'>
      <div className={cn(panel, 'p-5')}>
        <dl className='grid grid-cols-3 gap-3'>
          {[
            ['Views', '1,038', null],
            ['Started', '731', '70%'],
            ['Completed', '538', '74%']
          ].map(([label, value, rate]) => (
            <div key={label} className='min-w-0'>
              <dt className='text-xs text-muted-foreground'>{label}</dt>
              <dd className='mt-1 flex items-baseline gap-1.5'>
                <span className='font-display text-2xl'>{value}</span>
                {rate ? <span className='text-xs text-muted-foreground'>{rate}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
        <div className='mt-5 flex h-28 items-end gap-1 sm:gap-1.5'>
          {days.map(([views, completions], i) => (
            <span
              key={i}
              className='fp-grow relative flex-1 rounded-t-[4px] bg-chart-4/60'
              style={{ height: `${(views / peak) * 100}%`, '--i': i } as CSSProperties}
            >
              <span
                className='absolute inset-x-0 bottom-0 rounded-t-[4px] bg-primary'
                style={{ height: `${(completions / views) * 100}%` }}
              />
            </span>
          ))}
        </div>
        <div className='mt-3 flex gap-4 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5'>
            <span className='size-2 rounded-full bg-chart-4' /> Views
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='size-2 rounded-full bg-primary' /> Completed
          </span>
        </div>
      </div>
      <div className={cn(panel, 'p-5')}>
        <div className='flex items-baseline justify-between gap-3'>
          <p className='font-display text-lg leading-snug'>How likely are you to recommend us?</p>
          <p className='shrink-0 text-sm text-muted-foreground'>
            NPS <span className='font-display text-2xl text-foreground'>42</span>
          </p>
        </div>
        <div className='mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full'>
          {nps.map((part, i) => (
            <span
              key={part.label}
              className={cn('fp-grow-x h-full', part.className)}
              style={{ width: `${part.share}%`, '--i': i * 4 } as CSSProperties}
            />
          ))}
        </div>
        <div className='mt-2 flex justify-between text-xs text-muted-foreground'>
          {nps.map((part) => (
            <span key={part.label}>
              {part.label} {part.share}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
