import { arrayMove } from '@dnd-kit/sortable';
import {
  fixedValues,
  isChoice,
  newField,
  type FieldType,
  type FormDocument,
  type FormField
} from './form-model';

// Pure edits for the builder. Each keeps visibility rules consistent with the
// questions they reference, so a draft never needs repair before saving.

function mapFields(document: FormDocument, map: (field: FormField) => FormField) {
  return { ...document, fields: document.fields.map(map) };
}

export function updateField(
  document: FormDocument,
  id: string,
  update: Partial<Omit<FormField, 'id'>>
) {
  return mapFields(document, (f) => (f.id === id ? { ...f, ...update } : f));
}

export function insertField(document: FormDocument, field: FormField, afterId?: string) {
  const index = document.fields.findIndex((f) => f.id === afterId);
  const at = index < 0 ? document.fields.length : index + 1;
  return {
    ...document,
    fields: [...document.fields.slice(0, at), field, ...document.fields.slice(at)]
  };
}

// Returns null when the move would put a question before the one it depends on.
export function moveField(document: FormDocument, from: number, to: number) {
  if (from === to || from < 0 || to < 0 || to >= document.fields.length) return null;
  const fields = arrayMove(document.fields, from, to);
  const seen = new Set<string>();
  for (const field of fields) {
    if (field.condition && !seen.has(field.condition.fieldId)) return null;
    seen.add(field.id);
  }
  return { ...document, fields };
}

export function removeField(document: FormDocument, id: string) {
  if (document.fields.length <= 1) return document;
  return {
    ...document,
    fields: document.fields
      .filter((f) => f.id !== id)
      .map((f) => (f.condition?.fieldId === id ? { ...f, condition: null } : f))
  };
}

export function duplicateField(document: FormDocument, id: string) {
  const source = document.fields.find((f) => f.id === id);
  if (!source) return null;
  const copy: FormField = {
    ...source,
    id: crypto.randomUUID(),
    label: `${source.label.slice(0, 193)} (copy)`,
    options: [...source.options]
  };
  return { document: insertField(document, copy, id), copy };
}

// Rules that depend on `id` must keep matching a value the field can produce.
function retargetRules(document: FormDocument, id: string, rename?: Map<string, string>) {
  const source = document.fields.find((f) => f.id === id);
  const fixed = source ? fixedValues(source) : null;
  return mapFields(document, (f) => {
    if (f.condition?.fieldId !== id) return f;
    let value = rename?.get(f.condition.value) ?? f.condition.value;
    if (fixed?.length && !fixed.includes(value)) value = fixed[0];
    return { ...f, condition: { ...f.condition, value } };
  });
}

export function changeFieldType(document: FormDocument, id: string, type: FieldType) {
  const field = document.fields.find((f) => f.id === id);
  if (!field || field.type === type) return document;
  const options = isChoice(type)
    ? field.options.length
      ? field.options
      : newField(type).options
    : [];
  return retargetRules(updateField(document, id, { type, options }), id);
}

export function setOptions(document: FormDocument, id: string, options: string[]) {
  const field = document.fields.find((f) => f.id === id);
  if (!field) return document;
  // Same length means an option was edited in place; carry the rename over.
  const rename =
    options.length === field.options.length
      ? new Map(field.options.map((o, i) => [o, options[i]]))
      : undefined;
  return retargetRules(updateField(document, id, { options }), id, rename);
}
