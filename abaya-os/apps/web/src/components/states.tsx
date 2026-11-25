'use client';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { useI18n } from '@/i18n';
import { errorText } from '@/lib/errors';
import { ApiError } from '@/lib/api';

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  const denied = error instanceof ApiError && error.status === 403;
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-red-200 bg-red-50/40 p-10 text-center">
      <AlertTriangle className="size-8 text-red-700" />
      <p className="font-medium">{denied ? t('common.noPermission') : t('common.error')}</p>
      <p className="max-w-md text-sm text-muted-foreground">{errorText(error, t)}</p>
      {onRetry && !denied && <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw />{t('common.retry')}</Button>}
    </div>
  );
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description?: string; action?: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-ivory-50 p-12 text-center">
      <div className="rounded-full bg-gold-100 p-3"><Icon className="size-6 text-gold-700" /></div>
      <p className="font-display text-lg">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/** Renders loading / error / empty / data for a query uniformly. */
export function QueryState<T>({ q, isEmpty, empty, children, rows }: { q: UseQueryResult<T>; isEmpty?: (d: T) => boolean; empty?: React.ReactNode; children: (d: T) => React.ReactNode; rows?: number }) {
  if (q.isLoading) return <LoadingState rows={rows} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.data === undefined) return null;
  if (isEmpty?.(q.data) && empty) return <>{empty}</>;
  return <>{children(q.data)}</>;
}
