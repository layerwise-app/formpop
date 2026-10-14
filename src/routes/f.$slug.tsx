import { useEffect, useRef, type CSSProperties } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ConversationalForm } from '~/components/form-runner/conversational-form';
import { themeStyle } from '~/components/form-runner/form-theme';
import { PopMark } from '~/components/formpop-brand';
import { PageLoading, PageMessage } from '~/components/page-state';
import { Button } from '~/components/ui/button';
import type { FormDocument } from '~/lib/form-model';
import type { VisitEvent } from '~/lib/form-store';
import { getPublishedForm, submitForm, trackVisit } from '~/lib/forms.functions';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/f/$slug')({
  loader: ({ params }) => getPublishedForm({ data: params.slug }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: loaderData.document.title,
          description:
            loaderData.document.description || loaderData.document.welcome.description || undefined
        })
      : seo({ title: 'Form unavailable · Formpop' })
  }),
  pendingComponent: () => <PageLoading />,
  component: PublishedForm
});

// One anonymous id per tab, so reloads count as the same visit.
function visitSession(slug: string) {
  const key = `formpop:visit:${slug}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function PublishedForm() {
  const data = Route.useLoaderData();
  const { slug } = Route.useParams();
  const submissionId = useRef<string | null>(null);
  const session = useRef<string | null>(null);
  const track = useMutation({
    mutationFn: (event: VisitEvent) => {
      session.current ??= visitSession(slug);
      return trackVisit({ data: { slug, sessionId: session.current, event } });
    }
  });
  const { mutate } = track;
  const accepting = data?.accepting ?? false;

  useEffect(() => {
    if (accepting) mutate('view');
  }, [accepting, mutate]);

  if (!data) {
    return (
      <PageMessage
        title='This form isn’t available'
        description='It may have been unpublished, or the link may be incomplete. Check with the person who shared it.'
      >
        <Button variant='outline' asChild>
          <Link to='/'>Go to Formpop</Link>
        </Button>
      </PageMessage>
    );
  }

  if (!data.accepting) return <ClosedForm document={data.document} />;

  return (
    <ConversationalForm
      document={data.document}
      onStart={() => mutate('start')}
      onSubmit={async (answers, { website }) => {
        submissionId.current ??= crypto.randomUUID();
        await submitForm({
          data: {
            slug,
            publicationId: data.publicationId,
            submissionId: submissionId.current,
            answers,
            website
          }
        });
      }}
    />
  );
}

function ClosedForm({ document }: { document: Pick<FormDocument, 'title' | 'theme'> }) {
  return (
    <div
      style={themeStyle(document.theme)}
      className='flex min-h-dvh flex-col bg-(--fp-bg) px-5 py-6 text-(--fp-text) sm:px-10'
    >
      <span className='text-sm font-medium text-(--fp-soft)'>{document.title}</span>
      <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pb-16'>
        <h1 className='fp-rise font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05]'>
          This form is closed
        </h1>
        <p className='fp-rise mt-4 text-lg text-(--fp-soft)' style={{ '--d': 120 } as CSSProperties}>
          It’s no longer accepting responses.
        </p>
      </main>
      <Link
        to='/'
        className='inline-flex w-fit items-center gap-1.5 rounded-full border border-(--fp-line) px-3 py-1.5 text-xs font-medium text-(--fp-soft) transition-colors hover:text-(--fp-text)'
      >
        <PopMark className='size-3.5 text-(--fp-accent)' />
        Made with Formpop
      </Link>
    </div>
  );
}
