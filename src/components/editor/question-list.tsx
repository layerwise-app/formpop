import { useId } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Flag, GitBranch, GripVertical, Hand, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import { insertField, moveField } from '~/lib/form-edits';
import { newField, typeLabels, type FieldType, type FormField } from '~/lib/form-model';
import { cn } from '~/lib/utils';
import { useEditor } from './editor-state';
import { fieldIcons } from './field-icons';

export type Selection = 'welcome' | 'thanks' | (string & {});

const typeGroups: { label: string; types: FieldType[] }[] = [
  { label: 'Text', types: ['short_text', 'long_text', 'email', 'number', 'date'] },
  { label: 'Choice', types: ['single_choice', 'multiple_choice', 'yes_no'] },
  { label: 'Scale', types: ['rating', 'opinion_scale'] }
];

const itemClass =
  'flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40';

function SortableQuestion({
  field,
  index,
  selected,
  disabled,
  onSelect
}: {
  field: FormField;
  index: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id, disabled });
  const Icon = fieldIcons[field.type];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group/item relative flex items-center rounded-lg',
        isDragging && 'z-10 bg-background shadow-lg ring-1 ring-border',
        selected && 'bg-tint'
      )}
    >
      <button
        type='button'
        onClick={onSelect}
        aria-current={selected || undefined}
        className={cn(itemClass, 'pr-7', selected && 'hover:bg-tint')}
      >
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {index + 1}
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate font-medium'>{field.label}</span>
          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
            <Icon className='size-3' />
            {typeLabels[field.type]}
            {field.condition ? <GitBranch className='ml-0.5 size-3' aria-label='Has logic' /> : null}
            {field.required ? <span className='text-primary'>*</span> : null}
          </span>
        </span>
      </button>
      <button
        type='button'
        disabled={disabled}
        aria-label={`Reorder question ${index + 1}`}
        className='absolute right-1 flex size-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40 active:cursor-grabbing disabled:hidden'
        {...attributes}
        {...listeners}
      >
        <GripVertical className='size-3.5' />
      </button>
    </li>
  );
}

export function AddQuestionMenu({
  onAdd,
  disabled,
  className
}: {
  onAdd: (type: FieldType) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='sm' variant='outline' disabled={disabled} className={className}>
          <Plus />
          Add question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-52'>
        {typeGroups.map((group, i) => (
          <DropdownMenuGroup key={group.label}>
            {i > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
            {group.types.map((type) => {
              const Icon = fieldIcons[type];
              return (
                <DropdownMenuItem key={type} onSelect={() => onAdd(type)}>
                  <Icon />
                  {typeLabels[type]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuestionList({
  selected,
  onSelect
}: {
  selected: Selection;
  onSelect: (selection: Selection) => void;
}) {
  const { document, setDocument, locked } = useEditor();
  // A stable id keeps dnd-kit's aria-describedby equal on server and client.
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function add(type: FieldType) {
    const field = newField(type);
    setDocument((d) => insertField(d, field, selected));
    onSelect(field.id);
  }

  function dragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = document.fields.map((f) => f.id);
    const moved = moveField(document, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    if (moved) setDocument(moved);
    else toast.error('A question with logic must stay after the question it depends on.');
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between gap-2 px-3 pt-4 pb-2'>
        <h2 className='text-sm font-semibold'>
          Questions <span className='font-normal text-muted-foreground'>{document.fields.length}</span>
        </h2>
        <AddQuestionMenu onAdd={add} disabled={locked || document.fields.length >= 50} />
      </div>
      <div className='flex-1 overflow-y-auto px-2 pb-4'>
        <button
          type='button'
          onClick={() => onSelect('welcome')}
          aria-current={selected === 'welcome' || undefined}
          className={cn(itemClass, selected === 'welcome' && 'bg-tint hover:bg-tint')}
        >
          <span className='flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground'>
            <Hand className='size-3.5' />
          </span>
          <span className='flex-1 font-medium'>Welcome</span>
          {!document.welcome.enabled ? (
            <span className='text-xs text-muted-foreground'>Off</span>
          ) : null}
        </button>
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
          <SortableContext items={document.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ol className='my-1 flex flex-col gap-0.5'>
              {document.fields.map((field, index) => (
                <SortableQuestion
                  key={field.id}
                  field={field}
                  index={index}
                  selected={selected === field.id}
                  disabled={locked}
                  onSelect={() => onSelect(field.id)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <button
          type='button'
          onClick={() => onSelect('thanks')}
          aria-current={selected === 'thanks' || undefined}
          className={cn(itemClass, selected === 'thanks' && 'bg-tint hover:bg-tint')}
        >
          <span className='flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground'>
            <Flag className='size-3.5' />
          </span>
          <span className='flex-1 font-medium'>Thank you</span>
        </button>
      </div>
    </div>
  );
}
