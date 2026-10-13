import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getAuthSession } from '~/lib/auth.functions';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) throw redirect({ to: '/sign-in' });
    return { user: session.user };
  },
  component: Outlet,
});
