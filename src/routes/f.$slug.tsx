import { useRef } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ConversationalForm } from '~/components/conversational-form';
import { Brand } from '~/components/formpop-brand';
import { Button } from '~/components/ui/button';
import { getPublishedForm, submitForm } from '~/lib/forms.functions';

export const Route = createFileRoute('/f/$slug')({
  loader: ({ params }) => getPublishedForm({ data: params.slug }),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.document.title ? `${loaderData.document.title} · Formpop` : 'Form unavailable · Formpop' }] }),
  pendingComponent: () => <div className='page-loading'><span className='loading-dot' />A good conversation is on its way...</div>,
  component: PublishedForm,
});
function PublishedForm() {
  const data = Route.useLoaderData();
  const { slug } = Route.useParams();
  const submissionId = useRef<string | null>(null);
  if (!data) return <div className='unavailable-page'><Brand /><h1>This conversation is taking a break.</h1><p>This form is unpublished, archived, or no longer available. Please contact the person who shared it with you.</p><Button className='pop-primary' asChild><Link to='/'>Discover Formpop</Link></Button></div>;
  return <ConversationalForm document={data.document} onSubmit={async (answers) => {
    submissionId.current ??= crypto.randomUUID();
    await submitForm({ data: { slug, publicationId: data.publicationId, submissionId: submissionId.current, answers } });
  }} />;
}
