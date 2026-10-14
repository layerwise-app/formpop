import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { db } from '~/db';
import { auth } from '~/lib/auth';
import { inputId, inputText, validateDocument } from '~/lib/form-model';
import { formStore, type FormAction, type VisitEvent } from '~/lib/form-store';
import { templateInfo } from '~/lib/form-templates';

async function ownerId() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  if (!session) throw new Error('Please sign in to manage your forms.');
  return session.user.id;
}

const store = formStore(db);
const idInput = (value: unknown) => inputId(value);
const formActions: FormAction[] = ['duplicate', 'archive', 'restore', 'delete'];
const analyticsRanges = [7, 30, 90];

function object(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid request.');
  }
  return raw as Record<string, unknown>;
}

export const listForms = createServerFn({ method: 'GET' }).handler(async () =>
  store.list(await ownerId())
);

export const getForm = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }) => store.owned(await ownerId(), data));

export const createForm = createServerFn({ method: 'POST' })
  .validator((raw: { title: string; template?: string }) => {
    const data = object(raw);
    const title = inputText(data.title);
    const template =
      data.template === undefined ? undefined : inputText(data.template, 30);
    if (template && !templateInfo.some((t) => t.id === template)) {
      throw new Error('Unknown template.');
    }
    return { title, template };
  })
  .handler(async ({ data }) =>
    store.create(await ownerId(), data.title, data.template)
  );

export const saveForm = createServerFn({ method: 'POST' })
  .validator((raw: { id: string; revision: number; document: unknown }) => {
    const data = object(raw);
    if (
      typeof data.revision !== 'number' ||
      !Number.isSafeInteger(data.revision) ||
      data.revision < 1
    ) {
      throw new Error('Invalid revision.');
    }
    return {
      id: inputId(data.id),
      revision: data.revision,
      document: validateDocument(data.document)
    };
  })
  .handler(async ({ data }) =>
    store.save(await ownerId(), data.id, data.revision, data.document)
  );

export const publishForm = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }) => store.publish(await ownerId(), data));

export const formAction = createServerFn({ method: 'POST' })
  .validator((raw: { id: string; action: FormAction }) => {
    const data = object(raw);
    if (!formActions.includes(data.action as FormAction)) {
      throw new Error('Unknown action.');
    }
    return { id: inputId(data.id), action: data.action as FormAction };
  })
  .handler(async ({ data }) =>
    store.action(await ownerId(), data.id, data.action)
  );

export const setAccepting = createServerFn({ method: 'POST' })
  .validator((raw: { id: string; accepting: boolean }) => {
    const data = object(raw);
    if (typeof data.accepting !== 'boolean') throw new Error('Invalid setting.');
    return { id: inputId(data.id), accepting: data.accepting };
  })
  .handler(async ({ data }) =>
    store.setAccepting(await ownerId(), data.id, data.accepting)
  );

export const getPublishedForm = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }) => {
    const row = await store.published(data);
    if (!row) return null;
    return {
      document: row.document,
      publicationId: row.publicationId,
      accepting: row.accepting
    };
  });

export const submitForm = createServerFn({ method: 'POST' })
  .validator(
    (raw: {
      slug: string;
      publicationId: string;
      submissionId: string;
      answers: unknown;
      website?: string;
    }) => {
      const data = object(raw);
      // Honeypot: the field is invisible to people, so only bots fill it.
      if (data.website) throw new Error('Unable to submit this response.');
      if (
        !data.answers ||
        typeof data.answers !== 'object' ||
        Array.isArray(data.answers) ||
        JSON.stringify(data.answers).length > 600000
      ) {
        throw new Error('Response is invalid or too large.');
      }
      return {
        slug: inputId(data.slug),
        publicationId: inputId(data.publicationId),
        submissionId: inputId(data.submissionId),
        answers: data.answers
      };
    }
  )
  .handler(async ({ data }) =>
    store.submit(data.slug, data.publicationId, data.submissionId, data.answers)
  );

export const trackVisit = createServerFn({ method: 'POST' })
  .validator((raw: { slug: string; sessionId: string; event: VisitEvent }) => {
    const data = object(raw);
    if (data.event !== 'view' && data.event !== 'start') {
      throw new Error('Unknown event.');
    }
    return {
      slug: inputId(data.slug),
      sessionId: inputId(data.sessionId),
      event: data.event as VisitEvent
    };
  })
  .handler(async ({ data }) => store.track(data.slug, data.sessionId, data.event));

export const getAnalytics = createServerFn({ method: 'GET' })
  .validator((raw: { id: string; days: number }) => {
    const data = object(raw);
    if (!analyticsRanges.includes(data.days as number)) {
      throw new Error('Invalid range.');
    }
    return { id: inputId(data.id), days: data.days as number };
  })
  .handler(async ({ data }) =>
    store.analytics(await ownerId(), data.id, data.days)
  );

export const getResponses = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }) => store.responses(await ownerId(), data));

export const deleteResponse = createServerFn({ method: 'POST' })
  .validator((raw: { formId: string; responseId: string }) => {
    const data = object(raw);
    return { formId: inputId(data.formId), responseId: inputId(data.responseId) };
  })
  .handler(async ({ data }) =>
    store.deleteResponse(await ownerId(), data.formId, data.responseId)
  );

export const exportResponses = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }) => store.export(await ownerId(), data));
