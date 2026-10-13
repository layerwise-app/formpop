# Formpop

A conversational form builder with original branding, built on the existing
Layerwise stack. MIT licensed. No HeyForm source code, styles, assets, or text
are included.

## V1 Features

- Better Auth email/password and email OTP authentication.
- Owner-scoped dashboard, six original templates, search, sort, grid/list views.
- Create, duplicate, archive, restore, and permanently delete forms.
- Pointer and keyboard drag-and-drop, seven field types, labels, descriptions,
  required answers, and backward-only exact-match conditional visibility.
- Custom colors, welcome screens, and thank-you screens.
- Explicit Save Draft, ephemeral draft preview, and snapshot-based publishing.
- Public URLs at `/f/:slug`, conversational navigation, keyboard shortcuts,
  conditional question paths, progress, and server-validated submissions.
- Response counts, snapshot-aware details, and formula-safe CSV export.

Uploads, payments, teams, and external integrations are intentionally deferred.

## Architecture

The public landing page is `/`; the sample template workspace is `/demo`.
Authenticated management pages live under `/dashboard`, with editing and
responses at `/dashboard/forms/:formId`. Old `/forms/:formId` links redirect
to the new editor route. Published respondent URLs remain `/f/:slug`.

`src/lib/form-model.ts` contains shared validation and visibility logic.
`src/lib/forms.functions.ts` validates request inputs and obtains the owner
from the Better Auth session. `src/lib/form-store.ts` uses Drizzle against D1.
Never accept an owner ID from a client.

Drafts live in `forms`; immutable versions live in `publications`. Publishing
atomically inserts a snapshot and switches the active pointer. Saving a draft
does not update a publication. Submissions reference the publication they
answered, so response labels remain correct across future form edits. Requests
for stale public versions are rejected with a refresh message. Draft revisions
prevent silent overwrites from another browser tab. Submission IDs prevent
duplicate records on retries.

Archiving closes the public link and preserves responses. Restoring a published
form reopens its existing snapshot. Deletion cascades to publications and
responses and requires an explicit confirmation in the dashboard.

## Verification

```sh
pnpm run check-types
pnpm run build
pnpm test
pnpm run test:db
```

Tests require Node 22.15+ (or Node 24+) for the test-only TypeScript loader. D1 integration
tests create and remove an isolated temporary database and need a local binding
port; they do not modify the application's local database.

## Database and Deployment

```sh
pnpm run db:generate
pnpm run db:migrate
```

Drizzle owns all migrations. Layerwise applies them to production D1 on publish
and manages the development server and Cloudflare Workers deployment.

Keep `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `AUTH_EMAIL_URL` server-side.
Layerwise injects email delivery automatically; outside Layerwise the existing
`sendAuthEmail` helper logs development OTPs when no delivery URL is provided.
Delivery failures are surfaced by the existing auth UI.

## Interaction Reference

HeyForm's public documentation was studied for its three-panel editing flow,
question ordering, right-side settings, conversational navigation, and explicit
publishing. Formpop implements these general patterns independently:

- https://docs.heyform.net/quickstart/create-a-form
- https://docs.heyform.net/features/conditional-logic
- https://docs.heyform.net/features/form-settings
- https://docs.heyform.net/features/share

Formpop uses manual draft saving rather than HeyForm's autosave. The included
dnd-kit dependencies are MIT licensed; no copyleft HeyForm code is used.
