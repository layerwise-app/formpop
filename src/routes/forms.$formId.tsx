import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/forms/$formId')({
  validateSearch: (search: Record<string, unknown>): { tab: 'build' | 'design' | 'responses' } => ({ tab: search.tab === 'design' || search.tab === 'responses' ? search.tab : 'build' }),
  beforeLoad: ({ params, search }) => {
    throw redirect({ to: '/dashboard/forms/$formId', params, search, replace: true });
  },
});
