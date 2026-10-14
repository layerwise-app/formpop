import { useSyncExternalStore } from 'react';
import { ExternalLink, Send } from 'lucide-react';
import { CopyButton } from '~/components/copy-button';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { embedSnippet } from '~/lib/form-share';
import { useEditor } from './editor-state';

// The server can't know the public origin; React swaps it in after hydration.
const noSubscribe = () => () => {};
const useOrigin = () =>
  useSyncExternalStore(noSubscribe, () => window.location.origin, () => '');

function PublishButton({ label }: { label: string }) {
  const { publish, locked } = useEditor();
  return (
    <Button disabled={locked} onClick={() => publish.mutate()}>
      {publish.isPending ? <Spinner /> : <Send />}
      {label}
    </Button>
  );
}

export function SharePanel() {
  const editor = useEditor();
  const { saved, document, setDocument, live, unpublished, archived, accepting } = editor;
  const origin = useOrigin();
  const url = `${origin}/f/${saved.slug}`;

  if (!live) {
    return (
      <div className='mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center px-5 py-16'>
        <h2 className='font-display text-3xl'>
          {archived ? 'This form is archived' : 'Publish to get a link'}
        </h2>
        <p className='mt-2 text-muted-foreground'>
          {archived
            ? 'Restore it from your forms list to publish again.'
            : 'People can answer once the form is live. Later edits stay private until you publish again.'}
        </p>
        {archived ? null : (
          <div className='mt-6'>
            <PublishButton label='Publish' />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10'>
      {unpublished ? (
        <div className='flex flex-col gap-3 rounded-xl bg-tint px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sm text-secondary-foreground'>
            Your latest edits aren’t live yet.
          </p>
          <PublishButton label='Publish changes' />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Link</CardTitle>
          <CardDescription>Anyone with the link can respond.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-2 sm:flex-row'>
          <Input
            readOnly
            aria-label='Public link'
            value={url}
            onFocus={(e) => e.target.select()}
            className='font-mono text-xs sm:text-sm'
          />
          <div className='flex gap-2'>
            <CopyButton value={url} label='Copy link' variant='default' />
            <Button variant='outline' asChild>
              <a href={`/f/${saved.slug}`} target='_blank' rel='noopener noreferrer'>
                <ExternalLink />
                Open
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='flex items-start justify-between gap-6'>
          <div>
            <label htmlFor='accepting' className='font-medium'>
              Accepting responses
            </label>
            <p className='mt-1 text-sm text-muted-foreground'>
              {saved.accepting
                ? 'Turn off to close the form. Visitors will see that it’s closed.'
                : 'Closed. Visitors see a closed message instead of the form.'}
            </p>
          </div>
          <Switch
            id='accepting'
            checked={saved.accepting}
            disabled={accepting.isPending}
            onCheckedChange={(value) => accepting.mutate(value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embed</CardTitle>
          <CardDescription>Paste into any page that accepts HTML.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <pre className='overflow-x-auto rounded-lg bg-foreground px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-background'>
            {embedSnippet(url, document.title)}
          </pre>
          <div>
            <CopyButton value={embedSnippet(url, document.title)} label='Copy code' />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link preview</CardTitle>
          <CardDescription>Shown by chat apps and search engines after you publish.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            aria-label='Link preview description'
            placeholder='A sentence about this form'
            value={document.description}
            maxLength={1000}
            rows={2}
            disabled={editor.locked}
            onChange={(e) => setDocument((d) => ({ ...d, description: e.target.value }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
