import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';
import { Spinner } from '~/components/ui/spinner';
import { templateInfo, type TemplateId } from '~/lib/form-templates';
import { createForm } from '~/lib/forms.functions';

export type StartingPoint = TemplateId | 'blank';

const titleFor = (start: StartingPoint) =>
  templateInfo.find((t) => t.id === start)?.title ?? '';

function CreateForm({ initial, onCancel }: { initial: StartingPoint; onCancel: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [start, setStart] = useState<StartingPoint>(initial);
  const [title, setTitle] = useState(titleFor(initial));

  const create = useMutation({
    mutationFn: () =>
      createForm({
        data: {
          title: title.trim() || titleFor(start) || 'Untitled form',
          template: start === 'blank' ? undefined : start
        }
      }),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: ['forms'] });
      void navigate({ to: '/dashboard/forms/$formId', params: { formId: id }, search: { tab: 'build' } });
    }
  });

  function changeStart(next: StartingPoint) {
    // Keep a custom name; otherwise follow the chosen template.
    if (!title.trim() || title === titleFor(start)) setTitle(titleFor(next));
    setStart(next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className='flex flex-col gap-6'
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='form-title'>Name</FieldLabel>
          <Input
            id='form-title'
            autoFocus
            value={title}
            maxLength={200}
            placeholder='Untitled form'
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='form-start'>Start from</FieldLabel>
          <Select value={start} onValueChange={(v) => changeStart(v as StartingPoint)}>
            <SelectTrigger id='form-start' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='blank'>Blank form</SelectItem>
              <SelectSeparator />
              {templateInfo.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {create.error ? <FieldError>{create.error.message}</FieldError> : null}
      </FieldGroup>
      <DialogFooter>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' disabled={create.isPending}>
          {create.isPending ? <Spinner /> : null}
          Create form
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateFormDialog({
  start,
  onClose
}: {
  start: StartingPoint | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={start !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New form</DialogTitle>
          <DialogDescription>You can rename it any time.</DialogDescription>
        </DialogHeader>
        {start !== null ? <CreateForm key={start} initial={start} onCancel={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
