import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Inbox, RotateCw, Search, SearchX } from 'lucide-react';
import { toast } from 'sonner';
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
import { Skeleton } from '~/components/ui/skeleton';
import { Spinner } from '~/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table';
import { answerText } from '~/lib/form-model';
import { exportResponses } from '~/lib/forms.functions';
import { useEditor } from './editor-state';
import { formatDate, responsesQuery, type FormResponse } from './queries';
import { ResponseSheet } from './response-sheet';

function matches(response: FormResponse, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return Object.values(response.answers).some((a) =>
    answerText(a).toLowerCase().includes(needle)
  );
}

function downloadCsv({ csv, filename }: { csv: string; filename: string }) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResponsesPanel({ onShare }: { onShare: () => void }) {
  const { saved, document, live } = useEditor();
  const responses = useQuery(responsesQuery(saved.id));
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const exporting = useMutation({
    mutationFn: () => exportResponses({ data: saved.id }),
    onSuccess: (file) => {
      downloadCsv(file);
      toast.success('CSV downloaded');
    },
    onError: (e) => toast.error(e.message)
  });

  const rows = responses.data ?? [];
  const shown = rows.filter((r) => matches(r, query));
  const columns = document.fields.slice(0, 3);
  const openIndex = shown.findIndex((r) => r.id === openId);

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <h2 className='mr-auto font-display text-2xl'>
          Responses
          {responses.data ? (
            <span className='ml-2 align-middle text-sm font-normal text-muted-foreground tabular-nums'>
              {rows.length}
            </span>
          ) : null}
        </h2>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Refresh'
          disabled={responses.isFetching}
          onClick={() => void responses.refetch()}
        >
          <RotateCw className={responses.isFetching ? 'animate-spin' : undefined} />
        </Button>
        <Button
          variant='outline'
          disabled={exporting.isPending || !rows.length}
          onClick={() => exporting.mutate()}
        >
          {exporting.isPending ? <Spinner /> : <Download />}
          Export CSV
        </Button>
      </div>

      {rows.length ? (
        <div className='relative sm:max-w-xs'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='search'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search answers'
            aria-label='Search answers'
            className='pl-9'
          />
        </div>
      ) : null}

      {responses.isPending ? (
        <div className='flex flex-col gap-2' aria-label='Loading responses'>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-14 rounded-xl' />
          ))}
        </div>
      ) : responses.isError ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Couldn’t load responses</EmptyTitle>
            <EmptyDescription>{responses.error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant='outline' onClick={() => void responses.refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : !rows.length ? (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No responses yet</EmptyTitle>
            <EmptyDescription>
              {live
                ? 'Share the link and answers will show up here.'
                : 'Publish the form to start collecting answers.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onShare}>{live ? 'Share form' : 'Go to Share'}</Button>
          </EmptyContent>
        </Empty>
      ) : !shown.length ? (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No matches</EmptyTitle>
            <EmptyDescription>No answers contain “{query.trim()}”.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant='outline' onClick={() => setQuery('')}>
              Clear search
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className='hidden overflow-hidden rounded-xl border bg-card md:block'>
            <Table className='table-fixed'>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='w-40 pl-4'>Submitted</TableHead>
                  {columns.map((field) => (
                    <TableHead key={field.id} className='truncate'>
                      {field.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((response) => (
                  <TableRow
                    key={response.id}
                    tabIndex={0}
                    aria-label={`Open response from ${formatDate(response.createdAt)}`}
                    className='cursor-pointer focus-visible:bg-muted focus-visible:outline-none'
                    onClick={() => setOpenId(response.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenId(response.id);
                      }
                    }}
                  >
                    <TableCell className='pl-4 text-muted-foreground tabular-nums'>
                      {formatDate(response.createdAt)}
                    </TableCell>
                    {columns.map((field) => (
                      <TableCell key={field.id} className='truncate'>
                        {answerText(response.answers[field.id]) || (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className='flex flex-col gap-2 md:hidden'>
            {shown.map((response) => {
              const preview = columns
                .map((f) => answerText(response.answers[f.id]))
                .filter(Boolean);
              return (
                <li key={response.id}>
                  <button
                    type='button'
                    onClick={() => setOpenId(response.id)}
                    className='w-full rounded-xl border bg-card px-4 py-3 text-left transition hover:bg-muted active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
                  >
                    <span className='block text-xs text-muted-foreground tabular-nums'>
                      {formatDate(response.createdAt)}
                    </span>
                    <span className='mt-1 block truncate'>
                      {preview[0] ?? 'No answers to preview'}
                    </span>
                    {preview.length > 1 ? (
                      <span className='block truncate text-sm text-muted-foreground'>
                        {preview.slice(1).join(' · ')}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ResponseSheet
        formId={saved.id}
        response={openIndex >= 0 ? shown[openIndex] : null}
        number={rows.length - rows.findIndex((r) => r.id === openId)}
        hasNewer={openIndex > 0}
        hasOlder={openIndex >= 0 && openIndex < shown.length - 1}
        onNavigate={(step) => setOpenId(shown[openIndex + step]?.id ?? openId)}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
