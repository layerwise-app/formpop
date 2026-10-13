import { createFileRoute } from '@tanstack/react-router';
import { FormpopWorkspace } from '~/components/formpop-workspace';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/dashboard/')({
  head: () => ({
    meta: seo({ title: 'Your workspace · Formpop', description: 'Your private home for forms and responses.' }),
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  return <FormpopWorkspace user={user} />;
}
