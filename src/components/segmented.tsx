import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '~/lib/utils';

type Option<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

// Pill-shaped single choice control with arrow-key navigation.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = 'default'
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  label: string;
  className?: string;
  size?: 'default' | 'sm';
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    const buttons = event.currentTarget.querySelectorAll('button');
    buttons[options.indexOf(next)]?.focus();
  }
  return (
    <div
      role='radiogroup'
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('inline-flex items-center rounded-full bg-muted p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type='button'
            role='radio'
            aria-checked={active}
            aria-label={option.ariaLabel}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap text-muted-foreground outline-none transition-[color,background-color,box-shadow] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3.5',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3.5 text-sm',
              active && 'bg-background text-foreground shadow-sm'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
