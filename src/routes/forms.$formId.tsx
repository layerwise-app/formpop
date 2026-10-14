import { createFileRoute, redirect } from '@tanstack/react-router';
import { editorSearch } from '~/components/editor/editor-state';

// Older links pointed here; the editor now lives under /dashboard.
export const Route = createFileRoute('/forms/$formId')({
  validateSearch: editorSearch,
  beforeLoad: ({ params, search }) => {
    throw redirect({ to: '/dashboard/forms/$formId', params, search, replace: true });
  }
});
