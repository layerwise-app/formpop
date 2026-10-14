import { Link } from '@tanstack/react-router';
import { cn } from '~/lib/utils';

// A speech bubble with a single dot: one question at a time.
export function PopMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 32 32'
      aria-hidden='true'
      className={cn('size-7 shrink-0', className)}
    >
      <path
        d='M16 3.5C8.82 3.5 3 8.9 3 15.56c0 3.3 1.42 6.29 3.73 8.47L5.6 28.5l5.62-2.33c1.5.42 3.1.65 4.78.65 7.18 0 13-5.4 13-12.06C29 8.9 23.18 3.5 16 3.5Z'
        fill='currentColor'
      />
      <circle cx='16' cy='15.4' r='4.4' fill='#fff' />
    </svg>
  );
}

export function Brand({
  to = '/',
  className
}: {
  to?: '/' | '/dashboard';
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-label='Formpop home'
      className={cn(
        'inline-flex items-center gap-2 rounded-lg text-foreground outline-offset-4',
        className
      )}
    >
      <PopMark className='text-primary' />
      <span className='font-display text-[1.375rem] leading-none font-semibold'>
        Formpop
      </span>
    </Link>
  );
}
