import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { ActionRow, QuestionBlock } from '~/components/form-runner/form-screens';
import { themeStyle } from '~/components/form-runner/form-theme';
import { defaultTheme, type Answer, type FieldType, type FormField } from '~/lib/form-model';

function question(id: string, type: FieldType, label: string, options: string[] = []): FormField {
  return { id, type, label, description: '', required: true, options, condition: null };
}

const questions = [
  question('name', 'short_text', 'First, what should we call you?'),
  question('goal', 'single_choice', 'What are you collecting?', [
    'Product feedback',
    'Event RSVPs',
    'Job applications'
  ]),
  question('rating', 'rating', 'How was your first form?')
];

type Frame = { step: number; value?: Answer; ms: number };

// One scripted respondent: types a name, picks an answer, then rates. Every
// loop ends holding on the rating question.
const script: Frame[] = [
  { step: 0, ms: 1000 },
  ...['M', 'Ma', 'May', 'Maya'].map((value, i) => ({ step: 0, value, ms: i === 3 ? 1100 : 140 })),
  { step: 1, ms: 1300 },
  { step: 1, value: 'Product feedback', ms: 1100 },
  { step: 2, ms: 1100 },
  ...['1', '2', '3', '4', '5'].map((value, i) => ({ step: 2, value, ms: i === 4 ? 3400 : 110 }))
];
const last = script.length - 1;

export function HeroMockup() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(last);
      return;
    }
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % script.length), script[index].ms);
    return () => window.clearTimeout(timer);
  }, [index]);

  const frame = script[index];
  const field = questions[frame.step];

  return (
    <div aria-hidden inert className='relative'>
      <div
        style={themeStyle(defaultTheme)}
        className='relative flex h-[25rem] flex-col overflow-hidden rounded-[1.75rem] bg-(--fp-bg) text-(--fp-text) shadow-[0_1px_2px_rgb(30_18_32/0.06),0_32px_64px_-32px_rgb(30_18_32/0.35)] ring-1 ring-black/5 sm:h-[27rem]'
      >
        <div className='h-1 bg-(--fp-line)'>
          <span
            className='block h-full bg-(--fp-accent) transition-[width] duration-700 ease-out'
            style={{ width: `${((frame.step + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className='flex items-center justify-between px-6 pt-4 text-sm text-(--fp-soft) sm:px-8'>
          <span className='font-medium'>Welcome survey</span>
          <span className='tabular-nums'>
            {frame.step + 1} / {questions.length}
          </span>
        </div>
        <div className='flex flex-1 items-center px-6 pb-6 sm:px-10'>
          <div key={frame.step} className='fp-step-next w-full'>
            <QuestionBlock
              compact
              field={field}
              number={frame.step + 1}
              labelId={`hero-${field.id}`}
              value={frame.value}
              onChange={() => {}}
            >
              <ActionRow label='OK' onClick={() => {}} />
            </QuestionBlock>
          </div>
        </div>
      </div>
      {index === last ? (
        <div className='fp-rise absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border bg-card py-2.5 pr-4 pl-2.5 shadow-[0_16px_32px_-20px_rgb(30_18_32/0.45)] lg:-left-8'>
          <span className='flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground'>
            <Check className='size-4' />
          </span>
          <span className='text-sm leading-tight'>
            <span className='block font-medium'>New response</span>
            <span className='text-muted-foreground'>Welcome survey · just now</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
