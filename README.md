# Formpop

A conversational form builder with original branding, built on the existing
Layerwise stack. MIT licensed. No HeyForm source code, styles, assets, or text
are included.

## Features

- Better Auth email/password and email OTP authentication.
- Owner-scoped dashboard with totals, status filters, search (`/`), sort, and
  six themed templates.
- Create, duplicate, archive, restore, and permanently delete forms.
- Ten field types, pointer and keyboard drag-and-drop, required answers, and
  backward-only conditional visibility.
- Six theme presets plus custom colors, welcome screens, and thank-you screens.
- Explicit save (`Cmd/Ctrl+S`), draft preview, and snapshot-based publishing.
- Public URLs at `/f/:slug` with keyboard answering (letters, digits, Y/N,
  Enter), progress, and server-validated submissions.
- Share tab: copy link, embed snippet, link-preview description, and an
  accepting-responses toggle that shows visitors a closed page.
- Responses table, response detail, and formula-safe CSV export.
- Analytics: views → started → completed funnel, daily chart (7/30/90 days),
  and per-question summaries (averages, NPS, choice shares, recent text).

Uploads, payments, teams, and external integrations are intentionally deferred.

## Architecture

The public landing page is `/`; the sample template workspace is `/demo`.
Authenticated management pages live under `/dashboard`; the editor is
`/dashboard/forms/:formId?tab=build|design|share|responses|analytics`. Old
`/forms/:formId` links redirect there. Published respondent URLs remain
`/f/:slug`.

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

Analytics counts each browser session once in `form_visits` (view, then
start on the first answer); no personal data is stored. Completions come from
`submissions`.

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

`pnpm test` covers the form model, analytics, keyboard answers, editor edits,
and share helpers. Tests require Node 22.15+ (or Node 24+) for the test-only TypeScript loader. D1 integration
tests create and remove an isolated temporary database and need a local binding
port; they do not modify the application's local database.

## Database and Deployment

```sh
pnpm run db:generate
pnpm run db:migrate
```

Drizzle owns all migrations. `20261013142239_form_analytics` adds the
`form_visits` table and the `forms.accepting` flag. Layerwise applies them to production D1 on publish
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
