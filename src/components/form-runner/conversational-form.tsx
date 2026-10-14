import { useEffect, useId, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { PopMark } from '~/components/formpop-brand';
import { autoAdvances, keyAnswer } from '~/lib/form-keys';
import {
  answerError,
  validateAnswers,
  visibleFields,
  type Answer,
  type Answers,
  type FormDocument
} from '~/lib/form-model';
import { cn } from '~/lib/utils';
import { themeStyle } from './form-theme';
import { ActionRow, QuestionBlock, ThanksBlock, WelcomeBlock, runnerButton } from './form-screens';

type Props = {
  document: FormDocument;
  preview?: boolean;
  // Compact runners live inside a dialog or panel instead of filling the page.
  compact?: boolean;
  onStart?: () => void;
  onSubmit?: (answers: Answers, meta: { website: string }) => Promise<void>;
};

const WELCOME = -1;

export function ConversationalForm({
  document,
  preview = false,
  compact = false,
  onStart,
  onSubmit
}: Props) {
  const labelId = useId();
  const firstStep = document.welcome.enabled ? WELCOME : 0;
  const [step, setStep] = useState(firstStep);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [finished, setFinished] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  // Refs mirror state so timers and key handlers never act on stale values.
  const answersRef = useRef<Answers>({});
  const stepRef = useRef(step);
  const started = useRef(false);
  const advanceTimer = useRef<number>(undefined);
  const lastKey = useRef({ key: '', at: 0 });

  const visible = visibleFields(document.fields, answers);
  const current = step >= 0 ? visible[Math.min(step, visible.length - 1)] : undefined;
  const last = step >= visible.length - 1;
  const progress = finished
    ? 100
    : step < 0
      ? 0
      : Math.round((step / Math.max(1, visible.length)) * 100);

  function go(to: number) {
    window.clearTimeout(advanceTimer.current);
    setDirection(to > stepRef.current ? 'next' : 'prev');
    stepRef.current = to;
    setStep(to);
    setError('');
  }

  async function next() {
    if (pending || finished) return;
    const at = stepRef.current;
    if (at === WELCOME) return go(0);
    const latest = answersRef.current;
    const fields = visibleFields(document.fields, latest);
    const field = fields[at];
    if (field) {
      const issue = answerError(field, latest[field.id]);
      if (issue) return setError(issue);
    }
    if (at < fields.length - 1) return go(at + 1);
    setPending(true);
    try {
      const cleaned = validateAnswers(document, latest);
      await onSubmit?.(cleaned, { website: honeypot.current?.value ?? '' });
      setDirection('next');
      setFinished(true);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your response could not be saved. Please try again.');
    } finally {
      setPending(false);
    }
  }

  function back() {
    if (!pending && stepRef.current > 0) go(stepRef.current - 1);
  }

  function answer(value: Answer) {
    if (!current) return;
    const updated = { ...answersRef.current, [current.id]: value };
    answersRef.current = updated;
    setAnswers(updated);
    setError('');
    if (!started.current) {
      started.current = true;
      onStart?.();
    }
    window.clearTimeout(advanceTimer.current);
    // Recompute: this answer can reveal or hide later questions.
    const lastNow = stepRef.current >= visibleFields(document.fields, updated).length - 1;
    if (autoAdvances(current) && !lastNow) {
      const scheduled = stepRef.current;
      // Leave room for "1" then "0" (ten) on an opinion scale.
      const delay = current.type === 'opinion_scale' && value === '1' ? 700 : 420;
      advanceTimer.current = window.setTimeout(() => {
        if (stepRef.current === scheduled) void next();
      }, delay);
    }
  }

  function restart() {
    answersRef.current = {};
    started.current = false;
    setAnswers({});
    setFinished(false);
    go(firstStep);
  }

  function onKey(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing || pending || finished) return;
    const target = event.target as HTMLElement;
    const modifier = event.metaKey || event.ctrlKey;
    if (event.key === 'Enter') {
      if (target.tagName === 'TEXTAREA' && event.shiftKey) return;
      // Buttons and links handle Enter themselves, except multiple-choice
      // options: there Enter means "done", while letters or Space toggle.
      const choosing = current?.type === 'multiple_choice' && target.closest('[data-option]');
      if (!modifier && !choosing && target.closest('button, a')) return;
      event.preventDefault();
      void next();
      return;
    }
    if (modifier || event.altKey || target.matches('input, textarea, select')) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (target.closest('[role=radiogroup]') || stepRef.current < 0) return;
      event.preventDefault();
      if (event.key === 'ArrowUp') back();
      else void next();
      return;
    }
    if (!current) return;
    const now = Date.now();
    const afterOne = lastKey.current.key === '1' && now - lastKey.current.at < 600;
    lastKey.current = { key: event.key, at: now };
    const value = keyAnswer(current, event.key, answersRef.current[current.id], afterOne);
    if (value === null) return;
    event.preventDefault();
    answer(value);
  }

  // The latest handler is read through a ref so the listener is bound once.
  const keyHandler = useRef(onKey);
  keyHandler.current = onKey;
  useEffect(() => {
    const target: Window | HTMLElement | null = compact ? root.current : window;
    if (!target) return;
    const listener = (event: Event) => keyHandler.current(event as KeyboardEvent);
    target.addEventListener('keydown', listener);
    return () => target.removeEventListener('keydown', listener);
  }, [compact]);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    // Move focus to the answer so the keyboard flow continues on each step.
    const timer = window.setTimeout(() => {
      const scope = root.current?.querySelector('[data-step]');
      const target =
        scope?.querySelector<HTMLElement>('[data-autofocus]') ??
        scope?.querySelector<HTMLElement>('[aria-pressed=true], [aria-checked=true]') ??
        scope?.querySelector<HTMLElement>('[data-option="0"]') ??
        scope?.querySelector<HTMLElement>('[data-next]');
      if (compact && step === firstStep && !finished) return;
      target?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [step, finished, compact, firstStep]);

  const stepKey = finished ? 'thanks' : step < 0 ? 'welcome' : (current?.id ?? 'end');
  const visibleNumber = Math.min(step + 1, visible.length);

  return (
    <div
      ref={root}
      style={themeStyle(document.theme)}
      className={cn(
        'relative flex flex-col overflow-hidden bg-(--fp-bg) font-sans text-(--fp-text)',
        compact ? 'h-full min-h-[28rem]' : 'min-h-dvh'
      )}
    >
      <div
        role='progressbar'
        aria-label='Form progress'
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className='absolute inset-x-0 top-0 h-1 bg-(--fp-line)'
      >
        <span
          className='block h-full bg-(--fp-accent) transition-[width] duration-500 ease-out'
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className={cn('flex items-center gap-4', compact ? 'px-6 pt-5' : 'px-5 pt-6 sm:px-10')}>
        <span className='truncate text-sm font-medium text-(--fp-soft)'>{document.title}</span>
      </header>

      <main
        className={cn(
          'flex flex-1 items-center',
          compact ? 'px-6 py-8' : 'px-5 pt-10 pb-28 sm:px-10 sm:pt-12'
        )}
      >
        <div
          key={stepKey}
          data-step
          className={cn(
            'mx-auto w-full max-w-2xl',
            direction === 'next' ? 'fp-step-next' : 'fp-step-prev'
          )}
        >
          {finished ? (
            <ThanksBlock document={document} compact={compact}>
              {preview ? (
                <button type='button' data-next className={cn(runnerButton, 'mt-8')} onClick={restart}>
                  <RotateCcw className='size-4' />
                  Restart preview
                </button>
              ) : null}
            </ThanksBlock>
          ) : step < 0 ? (
            <WelcomeBlock document={document} compact={compact} onStart={() => void next()} />
          ) : current ? (
            <QuestionBlock
              field={current}
              number={visibleNumber}
              labelId={labelId}
              value={answers[current.id]}
              error={error}
              onChange={answer}
              compact={compact}
            >
              <ActionRow
                label={pending ? 'Sending' : last ? (preview ? 'Finish' : 'Submit') : 'OK'}
                done={last}
                pending={pending}
                onClick={() => void next()}
              />
            </QuestionBlock>
          ) : null}
        </div>
      </main>

      {/* Hidden from people; bots that fill every input reveal themselves. */}
      <input
        ref={honeypot}
        name='website'
        tabIndex={-1}
        autoComplete='off'
        aria-hidden
        className='absolute -left-[9999px] size-px opacity-0'
      />

      <footer
        className={cn(
          'flex items-center justify-between gap-3',
          compact ? 'px-6 pb-5' : 'fixed inset-x-0 bottom-0 bg-(--fp-bg)/90 px-5 py-4 backdrop-blur-sm sm:bg-transparent sm:px-10 sm:py-6 sm:backdrop-blur-none'
        )}
      >
        {preview || compact ? (
          <span />
        ) : (
          <Link
            to='/'
            className='inline-flex items-center gap-1.5 rounded-full border border-(--fp-line) bg-(--fp-bg) px-3 py-1.5 text-xs font-medium text-(--fp-soft) transition-colors hover:text-(--fp-text)'
          >
            <PopMark className='size-3.5 text-(--fp-accent)' />
            Made with Formpop
          </Link>
        )}
        {step >= 0 && !finished ? (
          <div className='flex items-center gap-2'>
            <span className='mr-1 text-xs text-(--fp-soft) tabular-nums'>
              {visibleNumber} / {visible.length}
            </span>
            <div className='flex overflow-hidden rounded-full bg-(--fp-accent) text-(--fp-on-accent)'>
              <button
                type='button'
                aria-label='Previous question'
                disabled={step <= 0 || pending}
                onClick={back}
                className='flex size-9 items-center justify-center outline-none transition-opacity hover:opacity-80 focus-visible:bg-black/15 disabled:opacity-40'
              >
                <ChevronUp className='size-4' />
              </button>
              <span className='my-2 w-px bg-current opacity-25' />
              <button
                type='button'
                aria-label='Next question'
                disabled={pending}
                onClick={() => void next()}
                className='flex size-9 items-center justify-center outline-none transition-opacity hover:opacity-80 focus-visible:bg-black/15 disabled:opacity-40'
              >
                <ChevronDown className='size-4' />
              </button>
            </div>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
