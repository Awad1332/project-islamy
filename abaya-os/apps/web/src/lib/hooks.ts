'use client';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { errorText, fieldErrors } from './errors';

/** Mutation with localized toasts, field errors and query invalidation. */
export function useAction<TVars, TRes = unknown>(fn: (v: TVars) => Promise<TRes>, opts: { invalidate?: QueryKey[]; success?: string | false; onSuccess?: (r: TRes) => void } = {}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: fn,
    onMutate: () => setErrors({}),
    onSuccess: async (r) => {
      for (const k of opts.invalidate ?? []) await qc.invalidateQueries({ queryKey: k });
      if (opts.success !== false) toast.success(opts.success ?? t('common.saved'));
      opts.onSuccess?.(r);
    },
    onError: (e) => {
      setErrors(fieldErrors(e, t));
      toast.error(errorText(e, t));
    },
  });
  return { ...m, errors };
}
