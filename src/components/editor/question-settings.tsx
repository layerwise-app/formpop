import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import {
  changeFieldType,
  duplicateField,
  moveField,
  removeField,
  setOptions,
  updateField
} from '~/lib/form-edits';
import {
  fieldTypes,
  fixedValues,
  isChoice,
  typeLabels,
  type FieldType,
  type FormField
} from '~/lib/form-model';
import { useEditor } from './editor-state';
import { fieldIcons } from './field-icons';
import type { Selection } from './question-list';

function IconAction({
  label,
  onClick,
  disabled,
  children,
  destructive
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size='icon-sm'
          variant='ghost'
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={destructive ? 'hover:bg-destructive/10 hover:text-destructive' : undefined}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ChoiceEditor({ field }: { field: FormField }) {
  const { setDocument } = useEditor();
  const set = (options: string[]) => setDocument((d) => setOptions(d, field.id, options));
  const duplicate = (option: string, index: number) =>
    field.options.some((o, i) => i !== index && o.trim() === option.trim());
  return (
    <Field>
      <FieldLabel>Choices</FieldLabel>
      <ol className='flex flex-col gap-1.5'>
        {field.options.map((option, index) => (
          <li key={index} className='flex items-center gap-1.5'>
            <span className='flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold text-muted-foreground'>
              {String.fromCharCode(65 + index)}
            </span>
            <Input
              aria-label={`Choice ${index + 1}`}
              aria-invalid={!option.trim() || duplicate(option, index) || undefined}
              value={option}
              maxLength={200}
              onChange={(e) => set(field.options.map((o, i) => (i === index ? e.target.value : o)))}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || field.options.length >= 30) return;
                e.preventDefault();
                const next = [...field.options];
                next.splice(index + 1, 0, `Option ${field.options.length + 1}`);
                set(next);
                // Focus the new row after React renders it.
                const list = e.currentTarget.closest('ol');
                requestAnimationFrame(() =>
                  list?.querySelectorAll('input')[index + 1]?.select()
                );
              }}
            />
            <Button
              size='icon-sm'
              variant='ghost'
              aria-label={`Remove choice ${index + 1}`}
              disabled={field.options.length <= 1}
              onClick={() => set(field.options.filter((_, i) => i !== index))}
            >
              <X />
            </Button>
          </li>
        ))}
      </ol>
      <Button
        size='sm'
        variant='ghost'
        className='w-fit text-primary hover:text-primary'
        disabled={field.options.length >= 30}
        onClick={() => set([...field.options, `Option ${field.options.length + 1}`])}
      >
        <Plus />
        Add choice
      </Button>
      <FieldDescription>Press Enter in a choice to add another below it.</FieldDescription>
    </Field>
  );
}

function LogicEditor({ field, index }: { field: FormField; index: number }) {
  const { document, setDocument } = useEditor();
  const earlier = document.fields.slice(0, index);
  const source = earlier.find((f) => f.id === field.condition?.fieldId);
  const values = source ? fixedValues(source) : null;
  const update = (condition: FormField['condition']) =>
    setDocument((d) => updateField(d, field.id, { condition }));
  return (
    <Field>
      <FieldLabel htmlFor='logic-source'>Show this question</FieldLabel>
      <Select
        value={field.condition?.fieldId ?? 'always'}
        disabled={!earlier.length}
        onValueChange={(id) => {
          if (id === 'always') return update(null);
          const target = earlier.find((f) => f.id === id)!;
          update({ fieldId: id, value: fixedValues(target)?.[0] ?? 'Yes' });
        }}
      >
        <SelectTrigger id='logic-source' className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='always'>Always</SelectItem>
          {earlier.map((f, i) => (
            <SelectItem key={f.id} value={f.id}>
              When {i + 1}. {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.condition ? (
        <div className='flex items-center gap-2'>
          <span className='shrink-0 text-sm text-muted-foreground'>
            {source?.type === 'multiple_choice' ? 'includes' : 'is'}
          </span>
          {values ? (
            <Select
              value={field.condition.value}
              onValueChange={(value) => update({ ...field.condition!, value })}
            >
              <SelectTrigger aria-label='Matching answer' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {values.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              aria-label='Matching answer'
              placeholder='Exact answer'
              value={field.condition.value}
              maxLength={200}
              onChange={(e) => update({ ...field.condition!, value: e.target.value })}
            />
          )}
        </div>
      ) : null}
      {!earlier.length ? (
        <FieldDescription>Logic can use answers to earlier questions.</FieldDescription>
      ) : null}
    </Field>
  );
}

function FieldSettings({ field, onSelect }: { field: FormField; onSelect: (s: Selection) => void }) {
  const { document, setDocument } = useEditor();
  const index = document.fields.findIndex((f) => f.id === field.id);
  const update = (patch: Partial<FormField>) =>
    setDocument((d) => updateField(d, field.id, patch));
  const move = (to: number) => {
    const moved = moveField(document, index, to);
    if (moved) setDocument(moved);
  };
  const Icon = fieldIcons[field.type];
  return (
    <>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-semibold'>Question {index + 1}</h2>
        <div className='flex'>
          <IconAction label='Move up' disabled={!moveField(document, index, index - 1)} onClick={() => move(index - 1)}>
            <ArrowUp />
          </IconAction>
          <IconAction label='Move down' disabled={!moveField(document, index, index + 1)} onClick={() => move(index + 1)}>
            <ArrowDown />
          </IconAction>
          <IconAction
            label='Duplicate'
            disabled={document.fields.length >= 50}
            onClick={() => {
              const result = duplicateField(document, field.id);
              if (!result) return;
              setDocument(result.document);
              onSelect(result.copy.id);
            }}
          >
            <Copy />
          </IconAction>
          <IconAction
            label='Delete'
            destructive
            disabled={document.fields.length <= 1}
            onClick={() => {
              setDocument((d) => removeField(d, field.id));
              const neighbour = document.fields[index + 1] ?? document.fields[index - 1];
              onSelect(neighbour?.id ?? 'welcome');
            }}
          >
            <Trash2 />
          </IconAction>
        </div>
      </div>
      <FieldGroup className='gap-5'>
        <Field>
          <FieldLabel htmlFor='field-type'>Type</FieldLabel>
          <Select
            value={field.type}
            onValueChange={(type) =>
              setDocument((d) => changeFieldType(d, field.id, type as FieldType))
            }
          >
            <SelectTrigger id='field-type' className='w-full'>
              <SelectValue>
                <Icon />
                {typeLabels[field.type]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => {
                const TypeIcon = fieldIcons[type];
                return (
                  <SelectItem key={type} value={type}>
                    <TypeIcon />
                    {typeLabels[type]}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor='field-label'>Question</FieldLabel>
          <Textarea
            id='field-label'
            value={field.label}
            maxLength={200}
            rows={2}
            aria-invalid={!field.label.trim() || undefined}
            onChange={(e) => update({ label: e.target.value })}
            className='min-h-16 font-display text-base'
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='field-description'>Description</FieldLabel>
          <Textarea
            id='field-description'
            placeholder='Optional'
            value={field.description}
            maxLength={1000}
            rows={2}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
        <Field orientation='horizontal'>
          <FieldLabel htmlFor='field-required' className='flex-1'>
            Required
          </FieldLabel>
          <Switch
            id='field-required'
            checked={field.required}
            onCheckedChange={(required) => update({ required })}
          />
        </Field>
        {isChoice(field.type) ? <ChoiceEditor field={field} /> : null}
        <LogicEditor field={field} index={index} />
      </FieldGroup>
    </>
  );
}

function ScreenSettings({ screen }: { screen: 'welcome' | 'thanks' }) {
  const { document, setDocument } = useEditor();
  if (screen === 'welcome') {
    const welcome = document.welcome;
    const set = (patch: Partial<typeof welcome>) =>
      setDocument((d) => ({ ...d, welcome: { ...d.welcome, ...patch } }));
    return (
      <>
        <h2 className='text-sm font-semibold'>Welcome screen</h2>
        <FieldGroup className='gap-5'>
          <Field orientation='horizontal'>
            <FieldLabel htmlFor='welcome-enabled' className='flex-1'>
              Show before the first question
            </FieldLabel>
            <Switch
              id='welcome-enabled'
              checked={welcome.enabled}
              onCheckedChange={(enabled) => set({ enabled })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='welcome-title'>Headline</FieldLabel>
            <Textarea
              id='welcome-title'
              value={welcome.title}
              maxLength={200}
              rows={2}
              aria-invalid={!welcome.title.trim() || undefined}
              onChange={(e) => set({ title: e.target.value })}
              className='min-h-16 font-display text-base'
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='welcome-description'>Description</FieldLabel>
            <Textarea
              id='welcome-description'
              placeholder='Optional'
              value={welcome.description}
              maxLength={2000}
              rows={3}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='welcome-button'>Button</FieldLabel>
            <Input
              id='welcome-button'
              value={welcome.button}
              maxLength={60}
              aria-invalid={!welcome.button.trim() || undefined}
              onChange={(e) => set({ button: e.target.value })}
            />
          </Field>
        </FieldGroup>
      </>
    );
  }
  const thanks = document.thankYou;
  const set = (patch: Partial<typeof thanks>) =>
    setDocument((d) => ({ ...d, thankYou: { ...d.thankYou, ...patch } }));
  return (
    <>
      <h2 className='text-sm font-semibold'>Thank-you screen</h2>
      <FieldGroup className='gap-5'>
        <Field>
          <FieldLabel htmlFor='thanks-title'>Headline</FieldLabel>
          <Textarea
            id='thanks-title'
            value={thanks.title}
            maxLength={200}
            rows={2}
            aria-invalid={!thanks.title.trim() || undefined}
            onChange={(e) => set({ title: e.target.value })}
            className='min-h-16 font-display text-base'
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='thanks-description'>Message</FieldLabel>
          <Textarea
            id='thanks-description'
            placeholder='Optional'
            value={thanks.description}
            maxLength={2000}
            rows={3}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>
      </FieldGroup>
    </>
  );
}

export function QuestionSettings({
  selected,
  onSelect
}: {
  selected: Selection;
  onSelect: (selection: Selection) => void;
}) {
  const { document, locked } = useEditor();
  const field = document.fields.find((f) => f.id === selected);
  return (
    <fieldset disabled={locked} className='flex min-w-0 flex-col gap-5 p-4'>
      {field ? (
        <FieldSettings key={field.id} field={field} onSelect={onSelect} />
      ) : (
        <ScreenSettings screen={selected === 'thanks' ? 'thanks' : 'welcome'} />
      )}
    </fieldset>
  );
}
