import { createFileRoute } from '@tanstack/react-router';
import { FormEditor } from '~/components/editor/form-editor';
import { editorSearch } from '~/components/editor/editor-state';
import { PageLoading } from '~/components/page-state';
import { getForm } from '~/lib/forms.functions';

export const Route = createFileRoute('/dashboard/forms/$formId')({
  validateSearch: editorSearch,
  loader: ({ params }) => getForm({ data: params.formId }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.draft.title} · Formpop` : 'Formpop' }]
  }),
  pendingComponent: () => <PageLoading label='Opening form' />,
  component: EditorPage
});

function EditorPage() {
  const form = Route.useLoaderData();
  const { tab } = Route.useSearch();
  return <FormEditor key={form.id} initial={form} tab={tab} />;
}
