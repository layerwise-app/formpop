import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/ui/sheet';
import { Spinner } from '~/components/ui/spinner';
import { answerText } from '~/lib/form-model';
import { deleteResponse } from '~/lib/forms.functions';
import { formatDate, responsesQuery, type FormResponse } from './queries';

export function ResponseSheet({
  formId,
  response,
  number,
  hasNewer,
  hasOlder,
  onNavigate,
  onClose
}: {
  formId: string;
  response: FormResponse | null;
  number: number;
  hasNewer: boolean;
  hasOlder: boolean;
  onNavigate: (step: 1 | -1) => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (responseId: string) => deleteResponse({ data: { formId, responseId } }),
    onSuccess: ({ id }) => {
      queryClient.setQueryData(responsesQuery(formId).queryKey, (rows) =>
        rows?.filter((r) => r.id !== id)
      );
      void queryClient.invalidateQueries({ queryKey: ['analytics', formId] });
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Response deleted');
      onClose();
    },
    onError: (e) => toast.error(e.message)
  });

  return (
    <Sheet open={Boolean(response)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        {response ? (
          <>
            <SheetHeader className='border-b pr-12'>
              <SheetTitle>Response #{number}</SheetTitle>
              <SheetDescription>{formatDate(response.createdAt)}</SheetDescription>
            </SheetHeader>
            <dl className='flex-1 overflow-y-auto px-4 py-2'>
              {response.document.fields.map((field, i) => {
                const text = answerText(response.answers[field.id]);
                return (
                  <div key={field.id} className='border-b py-4 last:border-0'>
                    <dt className='text-xs text-muted-foreground'>
                      {i + 1}. {field.label}
                    </dt>
                    <dd className={text ? 'mt-1 whitespace-pre-wrap break-words' : 'mt-1 text-muted-foreground'}>
                      {text || 'Skipped'}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <div className='flex items-center justify-between gap-2 border-t p-4'>
              <div className='flex gap-1'>
                <Button
                  size='icon-sm'
                  variant='outline'
                  aria-label='Newer response'
                  disabled={!hasNewer}
                  onClick={() => onNavigate(-1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  size='icon-sm'
                  variant='outline'
                  aria-label='Older response'
                  disabled={!hasOlder}
                  onClick={() => onNavigate(1)}
                >
                  <ChevronDown />
                </Button>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size='sm' variant='destructive'>
                    <Trash2 />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this response?</AlertDialogTitle>
                    <AlertDialogDescription>
                      It will be removed from results, analytics and exports. This can’t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant='destructive'
                      disabled={remove.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        remove.mutate(response.id);
                      }}
                    >
                      {remove.isPending ? <Spinner /> : null}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
