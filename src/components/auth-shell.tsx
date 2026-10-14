import type { ReactNode } from 'react';
import { Brand } from '~/components/formpop-brand';

export function AuthShell({
  title,
  description,
  footer,
  children
}: {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className='fp-dots flex min-h-dvh flex-col bg-background'>
      <header className='mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6'>
        <Brand />
      </header>
      <main className='flex flex-1 justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0'>
        <div className='fp-rise w-full max-w-sm'>
          <div className='rounded-3xl border bg-card p-6 shadow-[0_24px_48px_-32px_rgb(30_18_32/0.35)] sm:p-8'>
            <h1 className='font-display text-3xl'>{title}</h1>
            {description ? <p className='mt-2 text-muted-foreground'>{description}</p> : null}
            <div className='mt-6'>{children}</div>
          </div>
          {footer ? (
            <p className='mt-6 text-center text-sm text-muted-foreground'>{footer}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export function FormMessage({ error }: { error: Error | null }) {
  return error ? (
    <p role='alert' className='text-sm text-destructive'>
      {error.message}
    </p>
  ) : null;
}

export const textLink =
  'rounded-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline';
