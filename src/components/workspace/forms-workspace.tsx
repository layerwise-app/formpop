import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Search, SearchX } from 'lucide-react';
import { Segmented } from '~/components/segmented';
import { Button } from '~/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '~/components/ui/empty';
import { Input } from '~/components/ui/input';
import { Kbd } from '~/components/ui/kbd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import type { TemplateId } from '~/lib/form-templates';
import { listForms } from '~/lib/forms.functions';
import { CreateFormDialog, type StartingPoint } from './create-form-dialog';
import { FormCard, type FormRow } from './form-card';
import { TemplateGallery } from './template-gallery';
import { WorkspaceHeader, type WorkspaceUser } from './workspace-header';

type Filter = 'all' | 'live' | 'draft' | 'archived';
type Sort = 'recent' | 'name' | 'responses';

const sortLabels: Record<Sort, string> = {
  recent: 'Last edited',
  name: 'Name',
  responses: 'Most responses'
};

const inFilter: Record<Filter, (f: FormRow) => boolean> = {
  all: (f) => f.status !== 'archived',
  live: (f) => f.status === 'published',
  draft: (f) => f.status === 'draft',
  archived: (f) => f.status === 'archived'
};

const sorters: Record<Sort, (a: FormRow, b: FormRow) => number> = {
  recent: (a, b) => b.updatedAt - a.updatedAt,
  name: (a, b) => a.draft.title.localeCompare(b.draft.title),
  responses: (a, b) => b.submissionCount - a.submissionCount
};

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-xl border bg-card px-4 py-3'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='mt-1 font-display text-2xl tabular-nums'>{value.toLocaleString()}</dd>
    </div>
  );
}

export function FormsWorkspace({
  user,
  template
}: {
  user: WorkspaceUser;
  template?: TemplateId;
}) {
  const navigate = useNavigate();
  const forms = useQuery({ queryKey: ['forms', user.id], queryFn: () => listForms() });
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [creating, setCreating] = useState<StartingPoint | null>(template ?? null);
  const searchInput = useRef<HTMLInputElement>(null);

  // "/" jumps to search, like most list views.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || isTyping(event.target)) return;
      event.preventDefault();
      searchInput.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function closeCreate() {
    setCreating(null);
    if (template) void navigate({ to: '/dashboard', search: {}, replace: true });
  }

  const rows = forms.data ?? [];
  const count = (f: Filter) => rows.filter(inFilter[f]).length;
  const needle = search.trim().toLowerCase();
  const shown = rows
    .filter(inFilter[filter])
    .filter((f) => f.draft.title.toLowerCase().includes(needle))
    .sort(sorters[sort]);
  const responses = rows.reduce((sum, f) => sum + f.submissionCount, 0);

  return (
    <div className='min-h-dvh bg-background'>
      <WorkspaceHeader user={user} />
      <main className='mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10'>
        <div className='flex items-center justify-between gap-4'>
          <h1 className='font-display text-3xl sm:text-4xl'>Forms</h1>
          <Button onClick={() => setCreating('blank')}>
            <Plus />
            New form
          </Button>
        </div>

        {forms.isPending ? (
          <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3' aria-label='Loading forms'>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className='aspect-[16/13] rounded-2xl' />
            ))}
          </ul>
        ) : forms.isError ? (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyTitle>Couldn’t load your forms</EmptyTitle>
              <EmptyDescription>{forms.error.message}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant='outline' onClick={() => void forms.refetch()}>
                Try again
              </Button>
            </EmptyContent>
          </Empty>
        ) : !rows.length ? (
          <Empty className='border border-dashed'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No forms yet</EmptyTitle>
              <EmptyDescription>Start blank or pick a template below.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreating('blank')}>
                <Plus />
                New form
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <dl className='grid grid-cols-3 gap-3'>
              <Stat label='Forms' value={count('all')} />
              <Stat label='Live' value={count('live')} />
              <Stat label='Responses' value={responses} />
            </dl>

            <div className='flex flex-col gap-3 md:flex-row md:items-center'>
              <Segmented
                label='Filter forms'
                value={filter}
                onChange={setFilter}
                className='flex md:inline-flex'
                options={(['all', 'live', 'draft', 'archived'] as const).map((f) => ({
                  value: f,
                  label: (
                    <>
                      {{ all: 'All', live: 'Live', draft: 'Drafts', archived: 'Archived' }[f]}
                      <span className='text-xs text-muted-foreground tabular-nums'>{count(f)}</span>
                    </>
                  )
                }))}
              />
              <div className='flex gap-2 md:ml-auto'>
                <div className='relative min-w-0 flex-1 md:w-64 md:flex-none'>
                  <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    ref={searchInput}
                    type='search'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Search forms'
                    aria-label='Search forms'
                    className='pr-9 pl-9'
                  />
                  <Kbd className='pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 max-md:hidden'>
                    /
                  </Kbd>
                </div>
                <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <SelectTrigger aria-label='Sort forms' className='w-40 shrink-0'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align='end'>
                    {(Object.keys(sortLabels) as Sort[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {sortLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {shown.length ? (
              <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {shown.map((form) => (
                  <FormCard key={form.id} form={form} />
                ))}
              </ul>
            ) : (
              <Empty className='border border-dashed'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <SearchX />
                  </EmptyMedia>
                  <EmptyTitle>{needle ? 'No matching forms' : 'Nothing here'}</EmptyTitle>
                  <EmptyDescription>
                    {needle
                      ? `No form titles contain “${search.trim()}”.`
                      : filter === 'archived'
                        ? 'Archived forms show up here.'
                        : 'Forms in this state show up here.'}
                  </EmptyDescription>
                </EmptyHeader>
                {needle ? (
                  <EmptyContent>
                    <Button variant='outline' onClick={() => setSearch('')}>
                      Clear search
                    </Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            )}
          </>
        )}

        <section aria-labelledby='templates' className='mt-6 flex flex-col gap-4'>
          <h2 id='templates' className='font-display text-2xl'>
            Start from a template
          </h2>
          <TemplateGallery rowOnPhone onUse={setCreating} />
        </section>
      </main>
      <CreateFormDialog start={creating} onClose={closeCreate} />
    </div>
  );
}
