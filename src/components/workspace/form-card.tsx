import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, BarChart3, Copy, Inbox, Link2, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import { Spinner } from '~/components/ui/spinner';
import type { FormAction } from '~/lib/form-store';
import { formAction, listForms } from '~/lib/forms.functions';
import { cn } from '~/lib/utils';
import { FormThumbnail } from './form-thumbnail';
import { cardLift } from './template-gallery';

export type FormRow = Awaited<ReturnType<typeof listForms>>[number];

const actionToasts: Record<FormAction, string> = {
  duplicate: 'Copy created',
  archive: 'Archived. The public link is closed.',
  restore: 'Restored',
  delete: 'Form deleted'
};

const edited = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function FormStatus({ form }: { form: FormRow }) {
  if (form.status === 'archived') return <Badge variant='outline'>Archived</Badge>;
  if (form.status === 'draft') return <Badge variant='secondary'>Draft</Badge>;
  if (!form.accepting) return <Badge variant='outline'>Closed</Badge>;
  return (
    <Badge variant='secondary' className='gap-1.5 bg-tint text-primary-hover'>
      <span className='size-1.5 rounded-full bg-primary' />
      Live
    </Badge>
  );
}

export function FormCard({ form }: { form: FormRow }) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const action = useMutation({
    mutationFn: (kind: FormAction) => formAction({ data: { id: form.id, action: kind } }),
    onSuccess: (_, kind) => {
      setConfirmDelete(false);
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success(actionToasts[kind]);
    },
    onError: (e) => toast.error(e.message)
  });
  const link = { to: '/dashboard/forms/$formId', params: { formId: form.id } } as const;
  const title = form.draft.title;
  const unpublished = form.status === 'published' && form.revision !== form.publishedRevision;

  function copyLink() {
    navigator.clipboard
      .writeText(`${window.location.origin}/f/${form.slug}`)
      .then(() => toast.success('Link copied'))
      .catch(() => toast.error('Copy failed. Open Share to copy the link.'));
  }

  return (
    <li className={cn('group relative flex flex-col overflow-hidden rounded-2xl border bg-card', cardLift)}>
      <FormThumbnail
        document={form.draft}
        className={cn('border-b', form.status === 'archived' && 'opacity-60 grayscale')}
      />
      <div className='flex items-start gap-2 p-4 pr-2'>
        <div className='min-w-0 flex-1'>
          {/* The title link stretches over the whole card. */}
          <Link
            {...link}
            search={{ tab: 'build' }}
            className='block truncate font-medium outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50'
          >
            {title}
          </Link>
          <p className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
            <FormStatus form={form} />
            <span className='tabular-nums'>
              {form.submissionCount} {form.submissionCount === 1 ? 'response' : 'responses'}
            </span>
            <span aria-hidden='true'>·</span>
            <span>{unpublished ? 'Unpublished edits' : `Edited ${edited.format(form.updatedAt)}`}</span>
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Actions for ${title}`}
              className='relative z-10'
              disabled={action.isPending}
            >
              {action.isPending ? <Spinner /> : <MoreHorizontal />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem asChild>
              <Link {...link} search={{ tab: 'responses' }}>
                <Inbox />
                Responses
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link {...link} search={{ tab: 'analytics' }}>
                <BarChart3 />
                Analytics
              </Link>
            </DropdownMenuItem>
            {form.status === 'published' ? (
              <DropdownMenuItem onSelect={copyLink}>
                <Link2 />
                Copy link
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => action.mutate('duplicate')}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            {form.status === 'archived' ? (
              <DropdownMenuItem onSelect={() => action.mutate('restore')}>
                <ArchiveRestore />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => action.mutate('archive')}>
                <Archive />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant='destructive' onSelect={() => setConfirmDelete(true)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The form, its public link and all {form.submissionCount}{' '}
              {form.submissionCount === 1 ? 'response' : 'responses'} will be removed. This can’t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={action.isPending}
              onClick={(e) => {
                e.preventDefault();
                action.mutate('delete');
              }}
            >
              {action.isPending ? <Spinner /> : null}
              Delete form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
