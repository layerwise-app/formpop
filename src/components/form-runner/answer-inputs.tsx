import { useState, type CSSProperties } from 'react';
import { Check, Star } from 'lucide-react';
import {
  ratingValues,
  scaleValues,
  yesNoValues,
  type Answer,
  type FormField
} from '~/lib/form-model';
import { cn } from '~/lib/utils';

export type InputProps = {
  field: FormField;
  labelId: string;
  value: Answer | undefined;
  invalid: boolean;
  onChange: (value: Answer) => void;
  compact?: boolean;
};

const optionBase =
  'group/option flex w-full items-center gap-3 rounded-xl border border-(--fp-accent-line) bg-(--fp-accent-soft) px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 outline-none hover:bg-(--fp-accent-hover) focus-visible:ring-2 focus-visible:ring-(--fp-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--fp-bg) active:scale-[0.99]';
const optionSelected = 'border-(--fp-accent) bg-(--fp-accent-hover) fp-pop';

function KeyHint({ label, selected }: { label: string; selected: boolean }) {
  return (
    <kbd
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-md border font-sans text-xs font-semibold transition-colors',
        selected
          ? 'border-(--fp-accent) bg-(--fp-accent) text-(--fp-on-accent)'
          : 'border-(--fp-accent-line) bg-(--fp-bg)'
      )}
    >
      {label}
    </kbd>
  );
}

export function letterFor(index: number) {
  return String.fromCharCode(65 + index);
}

export function ChoiceInput({ field, value, onChange, compact, labelId }: InputProps) {
  const multiple = field.type === 'multiple_choice';
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const yesNo = field.type === 'yes_no';
  const options = yesNo ? yesNoValues : field.options;
  return (
    <div
      role='group'
      aria-labelledby={labelId}
      className={cn('fp-stagger flex flex-col gap-2', yesNo ? 'max-w-56' : 'max-w-md')}
    >
      {multiple ? (
        <p className='mb-1 text-sm text-(--fp-soft)'>Choose as many as you like</p>
      ) : null}
      {options.map((option, i) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type='button'
            data-option={i}
            aria-pressed={active}
            style={{ '--i': i } as CSSProperties}
            className={cn(optionBase, active && optionSelected)}
            onClick={() => {
              if (!multiple) return onChange(option);
              onChange(
                active
                  ? selected.filter((o) => o !== option)
                  : [...selected, option]
              );
            }}
          >
            <KeyHint label={yesNo ? option[0] : letterFor(i)} selected={active} />
            <span className={cn('flex-1', compact ? 'text-base' : 'text-base sm:text-lg')}>
              {option}
            </span>
            {active ? <Check className='size-4 text-(--fp-accent)' /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function RatingInput({ value, onChange, labelId }: InputProps) {
  const [hover, setHover] = useState(0);
  const current = Number(value ?? 0);
  const shown = hover || current;
  return (
    <div
      role='radiogroup'
      aria-labelledby={labelId}
      className='fp-stagger flex gap-1.5 sm:gap-2'
      onMouseLeave={() => setHover(0)}
    >
      {ratingValues.map((v, i) => {
        const n = Number(v);
        return (
          <button
            key={v}
            type='button'
            role='radio'
            data-option={i}
            aria-checked={current === n}
            aria-label={`${n} out of 5`}
            style={{ '--i': i } as CSSProperties}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(v)}
            className={cn(
              'flex size-12 items-center justify-center rounded-xl outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-(--fp-accent) sm:size-14',
              current === n && 'fp-pop'
            )}
          >
            <Star
              strokeWidth={1.6}
              className={cn(
                'size-9 transition-colors sm:size-10',
                n <= shown
                  ? 'fill-(--fp-accent) text-(--fp-accent)'
                  : 'fill-transparent text-(--fp-faint)'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ScaleInput({ value, onChange, labelId }: InputProps) {
  return (
    <div className='max-w-xl'>
      <div
        role='radiogroup'
        aria-labelledby={labelId}
        className='fp-stagger grid grid-cols-6 gap-1.5 sm:grid-cols-11'
      >
        {scaleValues.map((v, i) => {
          const active = value === v;
          return (
            <button
              key={v}
              type='button'
              role='radio'
              data-option={i}
              aria-checked={active}
              style={{ '--i': i * 0.5 } as CSSProperties}
              onClick={() => onChange(v)}
              className={cn(
                'h-12 rounded-lg border border-(--fp-accent-line) bg-(--fp-accent-soft) text-base font-medium tabular-nums outline-none transition-colors hover:bg-(--fp-accent-hover) focus-visible:ring-2 focus-visible:ring-(--fp-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--fp-bg)',
                active && 'fp-pop border-(--fp-accent) bg-(--fp-accent) text-(--fp-on-accent) hover:bg-(--fp-accent)'
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
      <div className='mt-2.5 flex justify-between text-sm text-(--fp-soft)'>
        <span>0 · Not likely</span>
        <span>Very likely · 10</span>
      </div>
    </div>
  );
}

const lineInput =
  'w-full border-0 border-b-2 border-(--fp-line) bg-transparent pb-2 outline-none transition-colors placeholder:text-(--fp-faint) focus:border-(--fp-accent) aria-invalid:border-[#e5484d]';

export function TextInput({ field, value, invalid, onChange, compact, labelId }: InputProps) {
  const text = typeof value === 'string' ? value : '';
  const size = compact ? 'text-xl' : 'text-xl sm:text-2xl';
  if (field.type === 'long_text') {
    return (
      <div className='max-w-xl'>
        <textarea
          data-autofocus
          aria-labelledby={labelId}
          aria-describedby={invalid ? `${labelId}-error` : undefined}
          aria-invalid={invalid}
          placeholder='Type your answer…'
          value={text}
          rows={3}
          maxLength={10000}
          onChange={(e) => onChange(e.target.value)}
          className={cn(lineInput, size, 'max-h-64 min-h-24 resize-none [field-sizing:content]')}
        />
        <p className='mt-2 hidden text-sm text-(--fp-soft) sm:block'>
          <kbd className='font-sans font-semibold'>Shift</kbd> +{' '}
          <kbd className='font-sans font-semibold'>Enter</kbd> for a new line
        </p>
      </div>
    );
  }
  const config = {
    email: { type: 'email', inputMode: 'email', placeholder: 'name@example.com' },
    number: { type: 'text', inputMode: 'decimal', placeholder: 'Type a number' },
    date: { type: 'date', inputMode: undefined, placeholder: undefined }
  } as const;
  const props =
    config[field.type as keyof typeof config] ??
    ({ type: 'text', inputMode: 'text', placeholder: 'Type your answer…' } as const);
  return (
    <input
      data-autofocus
      aria-labelledby={labelId}
      aria-describedby={invalid ? `${labelId}-error` : undefined}
      aria-invalid={invalid}
      type={props.type}
      inputMode={props.inputMode}
      placeholder={props.placeholder}
      autoComplete={field.type === 'email' ? 'email' : 'off'}
      value={text}
      maxLength={1000}
      onChange={(e) => onChange(e.target.value)}
      className={cn(lineInput, size, 'max-w-xl', field.type === 'date' && 'w-auto min-w-56')}
    />
  );
}

export function AnswerInput(props: InputProps) {
  switch (props.field.type) {
    case 'single_choice':
    case 'multiple_choice':
    case 'yes_no':
      return <ChoiceInput {...props} />;
    case 'rating':
      return <RatingInput {...props} />;
    case 'opinion_scale':
      return <ScaleInput {...props} />;
    default:
      return <TextInput {...props} />;
  }
}
