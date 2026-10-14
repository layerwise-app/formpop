import { useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { ConversationalForm } from '~/components/form-runner/conversational-form';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '~/components/ui/dialog';
import type { FormDocument } from '~/lib/form-model';
import { templateDocument, templateInfo, type TemplateId } from '~/lib/form-templates';
import { cn } from '~/lib/utils';
import { FormThumbnail } from './form-thumbnail';

type Template = (typeof templateInfo)[number];

export const cardLift =
  'transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-24px_rgb(30_18_32/0.35)]';

function TemplateCard({
  template,
  document,
  onOpen,
  index
}: {
  template: Template;
  document: FormDocument;
  onOpen: () => void;
  index: number;
}) {
  return (
    <li data-reveal style={{ '--i': index } as CSSProperties}>
      <button
        type='button'
        onClick={onOpen}
        className={cn(
          'group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          cardLift
        )}
      >
        <FormThumbnail
          document={document}
          className='border-b transition-transform duration-500 group-hover:scale-[1.02]'
        />
        <span className='flex flex-1 flex-col gap-1 p-4'>
          <span className='flex items-center justify-between gap-2'>
            <span className='font-medium'>{template.title}</span>
            <span className='text-xs text-muted-foreground'>{template.questions} questions</span>
          </span>
          <span className='text-sm text-muted-foreground'>{template.description}</span>
        </span>
      </button>
    </li>
  );
}

function TemplatePreview({
  template,
  onClose,
  onUse
}: {
  template: { info: Template; document: FormDocument } | null;
  onClose: () => void;
  onUse: (id: TemplateId) => void;
}) {
  return (
    <Dialog open={Boolean(template)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className='flex h-[min(46rem,92dvh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'
      >
        {template ? (
          <>
            <div className='flex items-center gap-3 border-b bg-background py-2 pr-2 pl-4'>
              <div className='min-w-0 flex-1'>
                <DialogTitle className='truncate text-sm font-medium'>{template.info.title}</DialogTitle>
                <DialogDescription className='truncate text-xs'>
                  Try it out. Answers aren’t saved.
                </DialogDescription>
              </div>
              <Button size='sm' onClick={() => onUse(template.info.id)}>
                Use template
                <ArrowRight />
              </Button>
              <DialogClose asChild>
                <Button variant='ghost' size='icon-sm' aria-label='Close preview'>
                  <X />
                </Button>
              </DialogClose>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto'>
              <ConversationalForm key={template.info.id} document={template.document} preview compact />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// On phones, a snap-scrolling row that bleeds to the screen edge (assumes a
// px-4 parent) instead of six stacked cards. The scroller clips vertically too,
// so pt-1 (offset by -mt-1) leaves room for the focus ring and hover lift.
const phoneRow =
  'max-sm:-mx-4 max-sm:-mt-1 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pt-1 max-sm:pb-4 max-sm:*:w-[80%] max-sm:*:shrink-0 max-sm:*:snap-start';

// Template cards open a live preview; `onUse` decides what "Use template" does.
export function TemplateGallery({
  onUse,
  leading,
  rowOnPhone,
  className
}: {
  onUse: (id: TemplateId) => void;
  leading?: ReactNode;
  rowOnPhone?: boolean;
  className?: string;
}) {
  // Built inside the component, not at module load: Workers disallow random
  // IDs in global scope.
  const [documents] = useState(() =>
    Object.fromEntries(templateInfo.map((t) => [t.id, templateDocument(t.id)])) as Record<
      TemplateId,
      FormDocument
    >
  );
  const [open, setOpen] = useState<TemplateId | null>(null);
  const info = templateInfo.find((t) => t.id === open);

  return (
    <>
      <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', rowOnPhone && phoneRow, className)}>
        {leading}
        {templateInfo.map((template, i) => (
          <TemplateCard
            key={template.id}
            template={template}
            document={documents[template.id]}
            index={i}
            onOpen={() => setOpen(template.id)}
          />
        ))}
      </ul>
      <TemplatePreview
        template={info ? { info, document: documents[info.id] } : null}
        onClose={() => setOpen(null)}
        onUse={(id) => {
          setOpen(null);
          onUse(id);
        }}
      />
    </>
  );
}
