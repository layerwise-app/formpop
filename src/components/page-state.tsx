import type { ReactNode } from 'react';
import { Brand, PopMark } from '~/components/formpop-brand';
import { Spinner } from '~/components/ui/spinner';

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className='flex min-h-dvh items-center justify-center bg-background text-muted-foreground'>
      <span className='inline-flex items-center gap-2 text-sm'>
        <Spinner className='text-primary' />
        {label}
      </span>
    </div>
  );
}

export function PageMessage({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className='flex min-h-dvh flex-col bg-background px-5 py-6 sm:px-10'>
      <Brand />
      <main className='mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center pb-16'>
        <PopMark className='mb-6 size-10 text-tint' />
        <h1 className='font-display text-4xl leading-tight text-balance'>{title}</h1>
        <p className='mt-3 text-muted-foreground'>{description}</p>
        {children ? <div className='mt-8 flex flex-wrap gap-2'>{children}</div> : null}
      </main>
    </div>
  );
}
