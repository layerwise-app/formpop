import { queryOptions } from '@tanstack/react-query';
import { getAnalytics, getResponses } from '~/lib/forms.functions';

export type FormResponse = Awaited<ReturnType<typeof getResponses>>[number];

export const responsesQuery = (formId: string) =>
  queryOptions({
    queryKey: ['responses', formId],
    queryFn: () => getResponses({ data: formId })
  });

export const analyticsQuery = (formId: string, days: number) =>
  queryOptions({
    queryKey: ['analytics', formId, days],
    queryFn: () => getAnalytics({ data: { id: formId, days } })
  });

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

export const formatDate = (timestamp: number) => dateFormat.format(timestamp);
