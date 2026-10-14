import { Star } from 'lucide-react';
import { themeStyle } from '~/components/form-runner/form-theme';
import { fixedValues, type FormDocument, type FormField } from '~/lib/form-model';
import { cn } from '~/lib/utils';

function AnswerSketch({ field }: { field: FormField }) {
  if (field.type === 'rating') {
    return (
      <span className='flex gap-1 text-(--fp-accent)'>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn('size-4', n <= 4 && 'fill-current')} />
        ))}
      </span>
    );
  }
  if (field.type === 'opinion_scale') {
    return (
      <span className='grid grid-cols-11 gap-0.5'>
        {Array.from({ length: 11 }, (_, n) => (
          <span
            key={n}
            className={cn(
              'h-4 rounded-[3px] border border-(--fp-accent-line)',
              n === 9 && 'border-(--fp-accent) bg-(--fp-accent)'
            )}
          />
        ))}
      </span>
    );
  }
  const options = fixedValues(field);
  if (options) {
    return (
      <span className='flex flex-col gap-1'>
        {options.slice(0, 2).map((option, i) => (
          <span
            key={option}
            className={cn(
              'flex w-3/4 items-center gap-1.5 truncate rounded-md border border-(--fp-accent-line) bg-(--fp-accent-soft) px-1.5 py-0.5 text-[0.6rem]',
              i === 0 && 'border-(--fp-accent)'
            )}
          >
            <span className='grid size-3 shrink-0 place-items-center rounded-[3px] border border-(--fp-accent-line) text-[0.5rem]'>
              {String.fromCharCode(65 + i)}
            </span>
            <span className='truncate'>{option}</span>
          </span>
        ))}
      </span>
    );
  }
  return <span className='block h-px w-3/4 bg-(--fp-accent-line)' />;
}

// A static miniature of a form's first question in its own theme.
export function FormThumbnail({
  document,
  className
}: {
  document: Pick<FormDocument, 'fields' | 'theme'>;
  className?: string;
}) {
  const field = document.fields[0];
  return (
    <div
      aria-hidden='true'
      style={themeStyle(document.theme)}
      className={cn(
        'relative flex aspect-[16/10] flex-col justify-center gap-3 overflow-hidden bg-(--fp-bg) px-6 text-(--fp-text)',
        className
      )}
    >
      <span className='absolute inset-x-0 top-0 h-0.5 bg-(--fp-line)'>
        <span className='block h-full w-1/3 bg-(--fp-accent)' />
      </span>
      {field ? (
        <>
          <span className='line-clamp-2 font-display text-[0.95rem] leading-snug'>
            <span className='mr-1 text-[0.7rem] text-(--fp-accent)'>1→</span>
            {field.label}
          </span>
          <AnswerSketch field={field} />
        </>
      ) : null}
      <span className='absolute right-4 bottom-3 rounded-full bg-(--fp-accent) px-2.5 py-0.5 text-[0.6rem] font-medium text-(--fp-on-accent)'>
        OK
      </span>
    </div>
  );
}
