import { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { themeStyle } from '~/components/form-runner/form-theme';
import {
  ActionRow,
  QuestionBlock,
  ThanksBlock,
  WelcomeBlock
} from '~/components/form-runner/form-screens';
import type { Answer, FormDocument } from '~/lib/form-model';
import { cn } from '~/lib/utils';
import type { Selection } from './question-list';

// A single themed screen of the draft. Answers stay local to the preview; the
// buttons step the editor selection so the preview doubles as navigation.
export function LivePreview({
  document,
  selected,
  onSelect,
  narrow
}: {
  document: FormDocument;
  selected: Selection;
  onSelect?: (selection: Selection) => void;
  narrow?: boolean;
}) {
  const [value, setValue] = useState<{ id: string; answer: Answer } | null>(null);
  const index = document.fields.findIndex((f) => f.id === selected);
  const field = document.fields[index];
  const total = document.fields.length;
  const progress = selected === 'thanks' ? 100 : field ? (index / total) * 100 : 0;
  const nextOf = (i: number): Selection => document.fields[i + 1]?.id ?? 'thanks';
  return (
    <div
      style={themeStyle(document.theme)}
      className={cn(
        'relative mx-auto flex h-full w-full flex-col overflow-hidden rounded-2xl bg-(--fp-bg) text-(--fp-text) shadow-[0_1px_2px_rgb(30_18_32/0.06),0_12px_40px_-12px_rgb(30_18_32/0.18)] ring-1 ring-black/5 transition-[max-width] duration-300',
        narrow ? 'max-w-[390px]' : 'max-w-none'
      )}
    >
      <div className='absolute inset-x-0 top-0 h-1 bg-(--fp-line)'>
        <span
          className='block h-full bg-(--fp-accent) transition-[width] duration-500'
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className='flex items-center justify-between gap-3 px-6 pt-5 text-sm text-(--fp-soft)'>
        <span className='truncate font-medium'>{document.title}</span>
        {field ? <span className='tabular-nums'>{index + 1} / {total}</span> : null}
      </div>
      <div className='flex flex-1 items-center overflow-y-auto px-6 py-8 sm:px-10'>
        <div key={selected} className='fp-step-next mx-auto w-full max-w-xl'>
          {selected === 'welcome' ? (
            <>
              {!document.welcome.enabled ? (
                <p className='mb-4 inline-flex items-center gap-1.5 rounded-full border border-(--fp-line) px-2.5 py-1 text-xs text-(--fp-soft)'>
                  <EyeOff className='size-3' />
                  Hidden · the form opens on question 1
                </p>
              ) : null}
              <WelcomeBlock
                document={document}
                compact
                onStart={() => onSelect?.(document.fields[0]?.id ?? 'thanks')}
              />
            </>
          ) : field ? (
            <QuestionBlock
              field={field}
              number={index + 1}
              labelId={`preview-${field.id}`}
              value={value?.id === field.id ? value.answer : undefined}
              onChange={(answer) => setValue({ id: field.id, answer })}
              compact
            >
              <ActionRow
                label={index === total - 1 ? 'Submit' : 'OK'}
                done={index === total - 1}
                onClick={() => onSelect?.(nextOf(index))}
              />
            </QuestionBlock>
          ) : (
            <ThanksBlock document={document} compact />
          )}
        </div>
      </div>
    </div>
  );
}
