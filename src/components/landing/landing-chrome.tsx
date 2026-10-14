import { Link } from '@tanstack/react-router';
import { Brand } from '~/components/formpop-brand';
import { Button } from '~/components/ui/button';

const navLink = 'max-sm:h-8 max-sm:px-3';

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className='sticky top-0 z-40 bg-background/85 backdrop-blur-md'>
      <div className='mx-auto flex h-16 max-w-6xl items-center gap-1 px-4 sm:gap-2 sm:px-6'>
        <Brand className='mr-auto' />
        <Button variant='ghost' asChild className='max-sm:hidden'>
          <Link to='/demo'>Demo</Link>
        </Button>
        {signedIn ? (
          <Button asChild className={navLink}>
            <Link to='/dashboard'>Open dashboard</Link>
          </Button>
        ) : (
          <>
            <Button variant='ghost' asChild className={navLink}>
              <Link to='/sign-in'>Sign in</Link>
            </Button>
            <Button asChild className={navLink}>
              <Link to='/sign-up'>Get started</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className='border-t'>
      <div className='mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-8 text-sm text-muted-foreground sm:px-6'>
        <Brand className='mr-auto' />
        <Link to='/demo' className='rounded-sm transition-colors hover:text-foreground'>
          Templates
        </Link>
        <Link to='/sign-in' className='rounded-sm transition-colors hover:text-foreground'>
          Sign in
        </Link>
        <span>© {new Date().getFullYear()} Formpop</span>
      </div>
    </footer>
  );
}
