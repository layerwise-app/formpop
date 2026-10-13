import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { db } from '~/db';
import { auth } from '~/lib/auth';
import { inputId, inputText, templateInfo, validateDocument } from '~/lib/form-model';
import { formStore } from '~/lib/form-store';

async function ownerId() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  if (!session) throw new Error('Please sign in to manage your forms.');
  return session.user.id;
}
const store = formStore(db);
const idInput = (value: unknown) => inputId(value);
function object(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid request.');
  return raw as Record<string, unknown>;
}

export const listForms = createServerFn({ method: 'GET' }).handler(async () => store.list(await ownerId()));
export const getForm = createServerFn({ method: 'GET' }).validator(idInput).handler(async ({ data }) => store.owned(await ownerId(), data));

export const createForm = createServerFn({ method: 'POST' }).validator((raw: { title: string; template?: string }) => {
  const data = object(raw);
  const title = inputText(data.title);
  const template = data.template === undefined ? undefined : inputText(data.template, 30);
  if (template && !templateInfo.some((t) => t.id === template)) throw new Error('Unknown template.');
  return { title, template };
}).handler(async ({ data }) => store.create(await ownerId(), data.title, data.template));

export const saveForm = createServerFn({ method: 'POST' }).validator((raw: { id: string; revision: number; document: unknown }) => {
  const data = object(raw);
  if (typeof data.revision !== 'number' || !Number.isSafeInteger(data.revision) || data.revision < 1) throw new Error('Invalid revision.');
  return { id: inputId(data.id), revision: data.revision, document: validateDocument(data.document) };
}).handler(async ({ data }) => store.save(await ownerId(), data.id, data.revision, data.document));

export const publishForm = createServerFn({ method: 'POST' }).validator(idInput).handler(async ({ data }) => store.publish(await ownerId(), data));

export const formAction = createServerFn({ method: 'POST' }).validator((raw: { id: string; action: 'duplicate' | 'archive' | 'restore' | 'delete' }) => {
  const data = object(raw);
  if (!['duplicate', 'archive', 'restore', 'delete'].includes(data.action as string)) throw new Error('Unknown action.');
  return { id: inputId(data.id), action: data.action as typeof raw.action };
}).handler(async ({ data }) => store.action(await ownerId(), data.id, data.action));

export const getPublishedForm = createServerFn({ method: 'GET' }).validator(idInput).handler(async ({ data }) => store.published(data));

export const submitForm = createServerFn({ method: 'POST' }).validator((raw: { slug: string; publicationId: string; submissionId: string; answers: unknown; website?: string }) => {
  const data = object(raw);
  if (data.website) throw new Error('Unable to submit this response.');
  if (!data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers) || JSON.stringify(data.answers).length > 600000) throw new Error('Response is invalid or too large.');
  return { slug: inputId(data.slug), publicationId: inputId(data.publicationId), submissionId: inputId(data.submissionId), answers: data.answers };
}).handler(async ({ data }) => store.submit(data.slug, data.publicationId, data.submissionId, data.answers));

export const getResponses = createServerFn({ method: 'GET' }).validator(idInput).handler(async ({ data }) => store.responses(await ownerId(), data));
export const exportResponses = createServerFn({ method: 'GET' }).validator(idInput).handler(async ({ data }) => store.export(await ownerId(), data));
