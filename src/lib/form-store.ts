import { and, desc, eq, count } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { forms, publications, submissions } from '../db/schema';
import { blankDocument, csvCell, templateDocument, validateAnswers, validateDocument, type FormDocument } from './form-model';

// The caller obtains ownerId from the server session, never from client input.
export function formStore(db: DrizzleD1Database) {
  async function owned(ownerId: string, id: string) {
    const [form] = await db.select().from(forms).where(and(eq(forms.id, id), eq(forms.ownerId, ownerId))).limit(1);
    if (!form) throw new Error('This form was not found in your workspace.');
    return form;
  }
  async function responses(id: string) {
    return db.select({ id: submissions.id, answers: submissions.answers, createdAt: submissions.createdAt, document: publications.document })
      .from(submissions).innerJoin(publications, eq(publications.id, submissions.publicationId))
      .where(eq(submissions.formId, id)).orderBy(desc(submissions.createdAt));
  }
  async function published(slug: string) {
    const [row] = await db.select({ document: publications.document, publicationId: publications.id, formId: forms.id })
      .from(forms).innerJoin(publications, eq(publications.id, forms.activePublicationId))
      .where(and(eq(forms.slug, slug), eq(forms.status, 'published'))).limit(1);
    return row ?? null;
  }
  return {
    owned,
    published,
    async list(ownerId: string) {
      const rows = await db.select({ form: forms, submissionCount: count(submissions.id) }).from(forms)
        .leftJoin(submissions, eq(submissions.formId, forms.id)).where(eq(forms.ownerId, ownerId))
        .groupBy(forms.id).orderBy(desc(forms.updatedAt));
      return rows.map(({ form, submissionCount }) => ({ ...form, submissionCount }));
    },
    async create(ownerId: string, title: string, template?: string) {
      const id = crypto.randomUUID();
      const draft = template ? templateDocument(template) : blankDocument(title);
      draft.title = title;
      await db.insert(forms).values({ id, ownerId, slug: crypto.randomUUID().replaceAll('-', '').slice(0, 16), draft, createdAt: Date.now(), updatedAt: Date.now() });
      return { id };
    },
    async save(ownerId: string, id: string, revision: number, document: FormDocument) {
      const form = await owned(ownerId, id);
      if (form.status === 'archived') throw new Error('Restore this form before editing.');
      const [saved] = await db.update(forms).set({ draft: validateDocument(document), revision: revision + 1, updatedAt: Date.now() })
        .where(and(eq(forms.id, form.id), eq(forms.ownerId, ownerId), eq(forms.revision, revision))).returning();
      if (!saved) throw new Error('This draft changed in another tab. Reload before saving to avoid overwriting it.');
      return saved;
    },
    async publish(ownerId: string, id: string) {
      const form = await owned(ownerId, id);
      if (form.status === 'archived') throw new Error('Restore this form before publishing.');
      const document = validateDocument(form.draft);
      const publicationId = crypto.randomUUID();
      // D1 batch is atomic: a public pointer never references a missing snapshot.
      await db.batch([
        db.insert(publications).values({ id: publicationId, formId: form.id, document, createdAt: Date.now() }),
        db.update(forms).set({ activePublicationId: publicationId, publishedRevision: form.revision, status: 'published', updatedAt: Date.now() })
          .where(and(eq(forms.id, form.id), eq(forms.ownerId, ownerId))),
      ]);
      return { slug: form.slug, publicationId };
    },
    async action(ownerId: string, id: string, action: 'duplicate' | 'archive' | 'restore' | 'delete') {
      const form = await owned(ownerId, id);
      if (action === 'duplicate') {
        const copyId = crypto.randomUUID();
        await db.insert(forms).values({ id: copyId, ownerId, slug: crypto.randomUUID().replaceAll('-', '').slice(0, 16), draft: { ...form.draft, title: `${form.draft.title.slice(0, 190)} (copy)` }, createdAt: Date.now(), updatedAt: Date.now() });
        return { id: copyId };
      }
      const scope = and(eq(forms.id, form.id), eq(forms.ownerId, ownerId));
      if (action === 'delete') await db.delete(forms).where(scope);
      else await db.update(forms).set({ status: action === 'archive' ? 'archived' : form.activePublicationId ? 'published' : 'draft', updatedAt: Date.now() }).where(scope);
      return { id: form.id };
    },
    async submit(slug: string, publicationId: string, submissionId: string, raw: unknown) {
      const row = await published(slug);
      if (!row) throw new Error('This form is no longer accepting responses.');
      if (row.publicationId !== publicationId) throw new Error('This form was updated. Refresh the page to answer the latest version.');
      const answers = validateAnswers(row.document, raw);
      const [existing] = await db.select({ id: submissions.id, formId: submissions.formId }).from(submissions).where(eq(submissions.id, submissionId)).limit(1);
      if (existing && existing.formId !== row.formId) throw new Error('Invalid response identifier.');
      if (!existing) await db.insert(submissions).values({ id: submissionId, formId: row.formId, publicationId, answers, createdAt: Date.now() }).onConflictDoNothing();
      return { success: true };
    },
    async responses(ownerId: string, id: string) { await owned(ownerId, id); return responses(id); },
    async export(ownerId: string, id: string) {
      const form = await owned(ownerId, id);
      const rows = await responses(id);
      const columns = new Map<string, string>();
      for (const row of rows) for (const field of row.document.fields) columns.set(field.id, field.label);
      const ids = [...columns.keys()];
      const header = ['Response ID', 'Submitted at', ...ids.map((id) => columns.get(id)!)];
      const lines = rows.map((r) => [r.id, new Date(r.createdAt).toISOString(), ...ids.map((id) => Array.isArray(r.answers[id]) ? (r.answers[id] as string[]).join('; ') : r.answers[id] as string ?? '')]);
      return { filename: `${form.draft.title.replace(/[^a-zA-Z0-9_-]/g, '_')}-responses.csv`, csv: '\uFEFF' + [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n') };
    },
  };
}
