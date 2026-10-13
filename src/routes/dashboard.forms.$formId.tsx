import { createFileRoute } from '@tanstack/react-router';
import { getForm } from '~/lib/forms.functions';
import { FormpopEditor } from '~/components/formpop-editor';

export const Route = createFileRoute('/dashboard/forms/$formId')({
  validateSearch: (search: Record<string, unknown>): { tab: 'build' | 'design' | 'responses' } => ({
    tab: search.tab === 'design' || search.tab === 'responses' ? search.tab : 'build',
  }),
  loader: ({ params }) => getForm({ data: params.formId }),
  pendingComponent: () => <div className='page-loading'><span className='loading-dot' />Getting your conversation ready...</div>,
  component: EditorPage,
});

function EditorPage() {
  const form = Route.useLoaderData();
  const { tab } = Route.useSearch();
  return <FormpopEditor key={form.id} initial={form} initialTab={tab} />;
}
