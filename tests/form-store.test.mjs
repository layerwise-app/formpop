import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import { drizzle } from 'drizzle-orm/d1';
import { migrate } from 'drizzle-orm/d1/migrator';
import { eq } from 'drizzle-orm';
import { formVisits, forms, publications, submissions, user } from '../src/db/schema.ts';
import { formStore } from '../src/lib/form-store.ts';
import { sumDays } from '../src/lib/form-analytics.ts';

function sampleAnswers(document) {
  const values = {
    email: 'person@example.test',
    single_choice: (f) => f.options[0],
    multiple_choice: (f) => [f.options[0]],
    yes_no: 'Yes',
    rating: '5',
    opinion_scale: '9',
    number: '2',
    date: '2027-01-01'
  };
  return Object.fromEntries(
    document.fields.map((f) => {
      const value = values[f.type] ?? '=test formula';
      return [f.id, typeof value === 'function' ? value(f) : value];
    })
  );
}

test('D1 owner isolation, snapshot publishing, lifecycle, analytics and export', async (t) => {
  const path = await mkdtemp(join(tmpdir(), 'formpop-test-'));
  const platform = await getPlatformProxy({
    configPath: 'wrangler.jsonc',
    remoteBindings: false,
    persist: { path }
  });
  t.after(async () => {
    await platform.dispose();
    await rm(path, { recursive: true, force: true });
  });
  const db = drizzle(platform.env.DB);
  await migrate(db, { migrationsFolder: 'drizzle' });
  await db.insert(user).values([
    { id: 'owner-one', name: 'Owner One', email: 'one@example.test' },
    { id: 'owner-two', name: 'Owner Two', email: 'two@example.test' }
  ]);
  const store = formStore(db);
  const { id } = await store.create('owner-one', 'A real conversation', 'contact');
  const draft = await store.owned('owner-one', id);
  assert.equal(draft.accepting, true);
  assert.equal(await store.published(draft.slug), null);
  assert.equal((await store.list('owner-two')).length, 0);

  // Every owner-scoped operation rejects another account.
  await assert.rejects(store.owned('owner-two', id), /not found/);
  await assert.rejects(store.save('owner-two', id, 1, draft.draft), /not found/);
  await assert.rejects(store.publish('owner-two', id), /not found/);
  await assert.rejects(store.action('owner-two', id, 'delete'), /not found/);
  await assert.rejects(store.responses('owner-two', id), /not found/);
  await assert.rejects(store.export('owner-two', id), /not found/);
  await assert.rejects(store.analytics('owner-two', id, 7), /not found/);
  await assert.rejects(store.setAccepting('owner-two', id, false), /not found/);

  assert.deepEqual(await store.track(draft.slug, 'visit-early', 'view'), { tracked: false });
  const firstPublish = await store.publish('owner-one', id);
  const live = await store.published(firstPublish.slug);
  const changed = structuredClone(draft.draft);
  changed.welcome.title = 'This is only a draft';
  changed.fields[0].label = 'A new label';
  await store.save('owner-one', id, 1, changed);
  assert.notEqual(
    (await store.published(firstPublish.slug)).document.welcome.title,
    changed.welcome.title
  );
  await assert.rejects(store.save('owner-one', id, 1, changed), /another tab/);

  // Visits are deduplicated per session; a start upgrades an existing view.
  await store.track(firstPublish.slug, 'visit-a', 'view');
  await store.track(firstPublish.slug, 'visit-a', 'view');
  await store.track(firstPublish.slug, 'visit-a', 'start');
  await store.track(firstPublish.slug, 'visit-a', 'start');
  await store.track(firstPublish.slug, 'visit-b', 'view');
  await store.track(firstPublish.slug, 'visit-c', 'start');

  const answers = sampleAnswers(live.document);
  await assert.rejects(
    store.submit(live.formId, firstPublish.publicationId, crypto.randomUUID(), answers),
    /no longer/
  );
  await assert.rejects(
    store.submit(firstPublish.slug, firstPublish.publicationId, crypto.randomUUID(), {}),
    /Please answer/
  );
  const responseId = crypto.randomUUID();
  await store.submit(firstPublish.slug, firstPublish.publicationId, responseId, answers);
  await store.submit(firstPublish.slug, firstPublish.publicationId, responseId, answers);
  assert.equal((await store.responses('owner-one', id)).length, 1, 'retry is idempotent');
  assert.equal((await store.list('owner-one'))[0].submissionCount, 1);

  const stats = await store.analytics('owner-one', id, 7);
  assert.deepEqual(sumDays(stats.daily), { views: 3, starts: 2, completions: 1 });

  // Closing stops new responses and tracking without unpublishing.
  await store.setAccepting('owner-one', id, false);
  assert.equal((await store.published(firstPublish.slug)).accepting, false);
  await assert.rejects(
    store.submit(firstPublish.slug, firstPublish.publicationId, crypto.randomUUID(), answers),
    /closed/
  );
  assert.deepEqual(await store.track(firstPublish.slug, 'visit-d', 'view'), { tracked: false });
  await store.setAccepting('owner-one', id, true);

  const nextPublish = await store.publish('owner-one', id);
  assert.equal(
    (await store.published(firstPublish.slug)).document.welcome.title,
    changed.welcome.title
  );
  await assert.rejects(
    store.submit(firstPublish.slug, firstPublish.publicationId, crypto.randomUUID(), answers),
    /updated/
  );
  assert.equal(
    (await store.responses('owner-one', id))[0].document.fields[0].label,
    live.document.fields[0].label,
    'response uses historical snapshot labels'
  );
  const csv = await store.export('owner-one', id);
  assert.ok(csv.csv.includes("'=test formula"));
  assert.ok(csv.filename.endsWith('.csv'));

  const copy = await store.action('owner-one', id, 'duplicate');
  const copied = await store.owned('owner-one', copy.id);
  assert.equal(copied.status, 'draft');
  assert.equal(copied.activePublicationId, null);
  assert.notEqual(copied.slug, firstPublish.slug);
  assert.equal((await store.responses('owner-one', copy.id)).length, 0);

  // Responses can only be deleted by their form's owner, through that form.
  await assert.rejects(store.deleteResponse('owner-two', id, responseId), /not found/);
  await assert.rejects(store.deleteResponse('owner-one', copy.id, responseId), /not found/);
  await store.deleteResponse('owner-one', id, responseId);
  assert.equal((await store.responses('owner-one', id)).length, 0);
  await store.submit(firstPublish.slug, nextPublish.publicationId, crypto.randomUUID(), answers);

  await store.action('owner-one', id, 'archive');
  assert.equal(await store.published(firstPublish.slug), null);
  await assert.rejects(store.save('owner-one', id, 2, changed), /Restore/);
  await assert.rejects(store.publish('owner-one', id), /Restore/);
  await assert.rejects(store.setAccepting('owner-one', id, false), /Restore/);
  await assert.rejects(
    store.submit(firstPublish.slug, nextPublish.publicationId, crypto.randomUUID(), answers),
    /no longer/
  );
  await store.action('owner-one', id, 'restore');
  assert.ok(await store.published(firstPublish.slug));
  await store.action('owner-one', id, 'delete');
  assert.equal((await db.select().from(forms).where(eq(forms.id, id))).length, 0);
  assert.equal(
    (await db.select().from(publications).where(eq(publications.formId, id))).length,
    0
  );
  assert.equal(
    (await db.select().from(submissions).where(eq(submissions.formId, id))).length,
    0
  );
  assert.equal(
    (await db.select().from(formVisits).where(eq(formVisits.formId, id))).length,
    0
  );
  assert.equal((await store.list('owner-one')).length, 1, 'duplicate survives original deletion');
});
