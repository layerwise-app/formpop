import { createFileRoute } from '@tanstack/react-router';
import { FormpopWorkspace } from '~/components/formpop-workspace';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/demo')({
  head: () => ({
    meta: seo({
      title: 'Explore the demo · Formpop',
      description: 'Explore original templates and try conversational forms. No account needed.',
    }),
  }),
  component: Demo,
});

function Demo() {
  return <FormpopWorkspace />;
}
