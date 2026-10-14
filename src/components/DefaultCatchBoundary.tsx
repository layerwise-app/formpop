import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { PageMessage } from '~/components/page-state';
import { Button } from '~/components/ui/button';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);
  return (
    <PageMessage
      title='Something went wrong'
      description={error instanceof Error ? error.message : 'Please try again.'}
    >
      <Button onClick={() => void router.invalidate()}>Try again</Button>
      <Button variant='outline' asChild>
        <Link to='/'>Go home</Link>
      </Button>
    </PageMessage>
  );
}
