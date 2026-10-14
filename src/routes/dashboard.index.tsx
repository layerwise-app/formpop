import { createFileRoute } from '@tanstack/react-router';
import { FormsWorkspace } from '~/components/workspace/forms-workspace';
import { templateInfo, type TemplateId } from '~/lib/form-templates';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/dashboard/')({
  // `?template=` opens the create dialog, e.g. from the landing gallery.
  validateSearch: (search: Record<string, unknown>): { template?: TemplateId } => ({
    template: templateInfo.find((t) => t.id === search.template)?.id
  }),
  head: () => ({ meta: seo({ title: 'Forms · Formpop' }) }),
  component: Dashboard
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { template } = Route.useSearch();
  return <FormsWorkspace user={user} template={template} />;
}
