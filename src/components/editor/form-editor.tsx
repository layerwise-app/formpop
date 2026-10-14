import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Eye, Save, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConversationalForm } from '~/components/form-runner/conversational-form';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '~/components/ui/dialog';
import { Spinner } from '~/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { validateDocument, type FormDocument } from '~/lib/form-model';
import { cn } from '~/lib/utils';
import { AnalyticsPanel } from './analytics-panel';
import { BuildPanel } from './build-panel';
import { DesignPanel } from './design-panel';
import {
  EditorContext,
  useEditorState,
  type EditorState,
  type EditorTab,
  type SavedForm
} from './editor-state';
import { ResponsesPanel } from './responses-panel';
import { SharePanel } from './share-panel';

const tabLabels: Record<EditorTab, string> = {
  build: 'Build',
  design: 'Design',
  share: 'Share',
  responses: 'Responses',
  analytics: 'Analytics'
};

function StatusBadge({ editor }: { editor: EditorState }) {
  if (editor.archived) return <Badge variant='outline'>Archived</Badge>;
  if (!editor.live) return <Badge variant='secondary'>Draft</Badge>;
  return (
    <Badge variant='secondary' className='gap-1.5 bg-tint text-primary-hover'>
      <span className='size-1.5 rounded-full bg-primary' />
      Live
    </Badge>
  );
}

function EditorHeader({
  editor,
  onPreview,
  onPublished
}: {
  editor: EditorState;
  onPreview: () => void;
  onPublished: () => void;
}) {
  const { document, setDocument, dirty, save, publish, locked, live, unpublished, archived } =
    editor;
  const upToDate = live && !unpublished;
  return (
    <header className='flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 sm:gap-3 sm:px-4'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/dashboard' aria-label='All forms'>
              <ArrowLeft />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>All forms</TooltipContent>
      </Tooltip>
      <input
        aria-label='Form name'
        value={document.title}
        maxLength={200}
        disabled={locked}
        onChange={(e) => setDocument((d) => ({ ...d, title: e.target.value }))}
        className='h-9 min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 font-display text-lg outline-none transition-colors field-sizing-content hover:border-border focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:hover:border-transparent sm:max-w-sm sm:min-w-32 sm:flex-initial'
      />
      <span className='hidden sm:inline-flex'>
        <StatusBadge editor={editor} />
      </span>
      <span
        aria-live='polite'
        className='ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex'
      >
        {dirty ? (
          <>
            <span className='size-1.5 rounded-full bg-primary' />
            Unsaved changes
          </>
        ) : (
          <>
            <Check className='size-3.5' />
            Saved
          </>
        )}
      </span>
      <div className='ml-auto flex items-center gap-1.5 md:ml-0'>
        <Button variant='ghost' className='max-sm:size-9 max-sm:px-0' onClick={onPreview}>
          <Eye />
          <span className='max-sm:sr-only'>Preview</span>
        </Button>
        <Button
          variant='outline'
          className='max-sm:size-9 max-sm:px-0'
          disabled={!dirty || locked}
          onClick={() => save.mutate()}
        >
          {save.isPending ? <Spinner /> : <Save />}
          <span className='max-sm:sr-only'>Save</span>
        </Button>
        <Button
          // Once live and current, the button reads as a status, not a faded CTA.
          variant={upToDate ? 'secondary' : 'default'}
          className={upToDate ? 'disabled:opacity-100' : undefined}
          disabled={locked || upToDate || archived}
          onClick={() => publish.mutate(undefined, { onSuccess: onPublished })}
        >
          {publish.isPending ? <Spinner /> : upToDate ? <Check /> : <Send />}
          {upToDate ? 'Published' : 'Publish'}
        </Button>
      </div>
    </header>
  );
}

function PreviewDialog({
  document,
  onOpenChange
}: {
  document: FormDocument | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='flex h-[min(46rem,92dvh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'
        aria-describedby={undefined}
      >
        <div className='flex items-center gap-3 border-b bg-background py-2 pr-2 pl-4'>
          <DialogTitle className='text-sm font-medium'>Preview</DialogTitle>
          <span className='text-xs text-muted-foreground'>Answers aren’t saved</span>
          <DialogClose asChild>
            <Button variant='ghost' size='icon-sm' className='ml-auto' aria-label='Close preview'>
              <X />
            </Button>
          </DialogClose>
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          {document ? <ConversationalForm document={document} preview compact /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FormEditor({ initial, tab }: { initial: SavedForm; tab: EditorTab }) {
  const editor = useEditorState(initial);
  const navigate = useNavigate();
  const [preview, setPreview] = useState<FormDocument | null>(null);
  const { dirty, locked, save } = editor;

  const goTo = (next: EditorTab) =>
    void navigate({
      to: '/dashboard/forms/$formId',
      params: { formId: initial.id },
      search: { tab: next },
      replace: true
    });

  function openPreview() {
    try {
      setPreview(validateDocument(editor.document));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Check the form settings.');
    }
  }

  // Cmd/Ctrl+S saves the draft instead of opening the browser save dialog.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 's' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      if (dirty && !locked) save.mutate();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dirty, locked, save]);

  return (
    <EditorContext.Provider value={editor}>
      <div className='flex h-dvh flex-col bg-background'>
        <EditorHeader editor={editor} onPreview={openPreview} onPublished={() => goTo('share')} />
        <nav aria-label='Editor sections' className='shrink-0 border-b bg-background'>
          <div className='flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4'>
            {(Object.keys(tabLabels) as EditorTab[]).map((id) => (
              <Link
                key={id}
                to='/dashboard/forms/$formId'
                params={{ formId: initial.id }}
                search={{ tab: id }}
                replace
                aria-current={tab === id ? 'page' : undefined}
                className={cn(
                  'relative shrink-0 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40',
                  'after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform',
                  'aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100'
                )}
              >
                {tabLabels[id]}
              </Link>
            ))}
          </div>
        </nav>
        <main className={cn('flex min-h-0 flex-1 flex-col', tab !== 'build' && 'overflow-y-auto')}>
          {tab === 'build' ? <BuildPanel onPreview={openPreview} /> : null}
          {tab === 'design' ? <DesignPanel /> : null}
          {tab === 'share' ? <SharePanel /> : null}
          {tab === 'responses' ? <ResponsesPanel onShare={() => goTo('share')} /> : null}
          {tab === 'analytics' ? <AnalyticsPanel /> : null}
        </main>
      </div>
      <PreviewDialog document={preview} onOpenChange={(open) => !open && setPreview(null)} />
    </EditorContext.Provider>
  );
}
