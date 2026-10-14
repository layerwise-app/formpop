import type { CSSProperties, ReactNode } from 'react';
import { AlertCircle, ArrowRight, Check, CornerDownLeft } from 'lucide-react';
import type { Answer, FormDocument, FormField } from '~/lib/form-model';
import { cn } from '~/lib/utils';
import { AnswerInput } from './answer-inputs';

export const runnerButton =
  'inline-flex h-11 items-center gap-2 rounded-full bg-(--fp-accent) px-6 text-base font-medium text-(--fp-on-accent) outline-none transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-(--fp-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--fp-bg) disabled:pointer-events-none disabled:opacity-60';

export function questionTitle(compact?: boolean) {
  return cn(
    'font-display text-pretty',
    compact
      ? 'text-2xl leading-tight'
      : 'text-[clamp(1.75rem,4.2vw,2.75rem)] leading-[1.12]'
  );
}

export function EnterHint() {
  return (
    <span className='hidden items-center gap-1 text-sm text-(--fp-soft) sm:inline-flex'>
      press <strong className='font-semibold text-(--fp-text)'>Enter</strong>
      <CornerDownLeft className='size-3.5' />
    </span>
  );
}

export function ActionRow({
  label,
  done,
  pending,
  onClick
}: {
  label: string;
  done?: boolean;
  pending?: boolean;
  onClick: () => void;
}) {
  return (
    <div className='mt-8 flex items-center gap-4'>
      <button
        type='button'
        data-next
        disabled={pending}
        onClick={onClick}
        className={runnerButton}
      >
        {label}
        {pending ? (
          <span className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
        ) : done ? (
          <Check className='size-4' />
        ) : (
          <ArrowRight className='size-4' />
        )}
      </button>
      {pending ? null : <EnterHint />}
    </div>
  );
}

export function QuestionBlock({
  field,
  number,
  labelId,
  value,
  error,
  onChange,
  compact,
  children
}: {
  field: FormField;
  number: number;
  labelId: string;
  value: Answer | undefined;
  error?: string;
  onChange: (value: Answer) => void;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className='mb-3 flex items-center gap-1 text-sm font-semibold text-(--fp-accent) tabular-nums'>
        {number}
        <ArrowRight className='size-3.5' />
      </p>
      <h2 id={labelId} className={questionTitle(compact)}>
        {field.label}
        {field.required ? (
          <span aria-hidden className='text-(--fp-accent)'>
            {' '}
            *
          </span>
        ) : null}
      </h2>
      {field.description ? (
        <p className='mt-3 max-w-xl text-base text-(--fp-soft) sm:text-lg'>
          {field.description}
        </p>
      ) : null}
      <div className={compact ? 'mt-6' : 'mt-8'}>
        <AnswerInput
          field={field}
          labelId={labelId}
          value={value}
          invalid={Boolean(error)}
          onChange={onChange}
          compact={compact}
        />
      </div>
      {error ? (
        <p
          id={`${labelId}-error`}
          role='alert'
          className='fp-pop mt-5 inline-flex items-center gap-2 rounded-md bg-[#fde8ec] px-2.5 py-1.5 text-sm font-medium text-[#b4123c]'
        >
          <AlertCircle className='size-4' />
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function WelcomeBlock({
  document,
  compact,
  onStart
}: {
  document: FormDocument;
  compact?: boolean;
  onStart: () => void;
}) {
  const count = document.fields.length;
  const minutes = Math.max(1, Math.ceil(count / 4));
  return (
    <div className='fp-stagger'>
      <h1
        className={cn(
          'font-display text-balance',
          compact ? 'text-3xl leading-tight' : 'text-[clamp(2.25rem,6vw,4rem)] leading-[1.04]'
        )}
      >
        {document.welcome.title}
      </h1>
      {document.welcome.description ? (
        <p className='mt-4 max-w-lg text-lg text-(--fp-soft)'>
          {document.welcome.description}
        </p>
      ) : null}
      <div style={{ '--i': 2 } as CSSProperties}>
        <ActionRow label={document.welcome.button} onClick={onStart} />
      </div>
      <p className='mt-6 text-sm text-(--fp-soft)'>
        {count} {count === 1 ? 'question' : 'questions'} · about {minutes} min
      </p>
    </div>
  );
}

export function ThanksBlock({
  document,
  compact,
  children
}: {
  document: FormDocument;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className='fp-stagger'>
      <span className='mb-6 inline-flex size-14 items-center justify-center rounded-full bg-(--fp-accent) text-(--fp-on-accent)'>
        <Check className='size-7' strokeWidth={2.5} />
      </span>
      <h1
        className={cn(
          'font-display text-balance',
          compact ? 'text-3xl leading-tight' : 'text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05]'
        )}
      >
        {document.thankYou.title}
      </h1>
      {document.thankYou.description ? (
        <p className='mt-4 max-w-lg text-lg text-(--fp-soft)'>
          {document.thankYou.description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
