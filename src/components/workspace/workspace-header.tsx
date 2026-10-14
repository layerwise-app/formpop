import { Link } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '~/components/formpop-brand';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import { authClient } from '~/lib/auth-client';

export type WorkspaceUser = { id: string; name: string; email: string };

function AccountMenu({ user }: { user: WorkspaceUser }) {
  const queryClient = useQueryClient();
  const signOut = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message ?? 'Sign out failed.');
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.assign('/');
    },
    onError: (e) => toast.error(e.message)
  });
  const initial = (user.name.trim() || user.email).charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label='Account' className='rounded-full'>
          <span className='grid size-8 place-items-center rounded-full bg-tint text-sm font-semibold text-primary-hover'>
            {initial}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-60'>
        <DropdownMenuLabel className='font-normal'>
          <span className='block truncate font-medium text-foreground'>{user.name}</span>
          <span className='block truncate text-xs text-muted-foreground'>{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onSelect={(e) => {
            e.preventDefault();
            signOut.mutate();
          }}
        >
          <LogOut />
          {signOut.isPending ? 'Signing out' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WorkspaceHeader({ user }: { user?: WorkspaceUser }) {
  return (
    <header className='sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md'>
      <div className='mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6'>
        <Brand to={user ? '/dashboard' : '/'} />
        <div className='ml-auto flex items-center gap-2'>
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <Button variant='ghost' asChild>
                <Link to='/sign-in'>Sign in</Link>
              </Button>
              <Button asChild>
                <Link to='/sign-up'>Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
