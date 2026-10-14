import { Link } from '@tanstack/react-router';
import { PageMessage } from '~/components/page-state';
import { Button } from '~/components/ui/button';

export function NotFound() {
  return (
    <PageMessage
      title='Page not found'
      description='The link may be broken, or the page may have moved.'
    >
      <Button asChild>
        <Link to='/'>Go home</Link>
      </Button>
    </PageMessage>
  );
}
