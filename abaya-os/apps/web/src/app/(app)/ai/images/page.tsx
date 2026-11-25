'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon, Plug } from 'lucide-react';
import { IMAGE_JOB_TYPES } from '@abaya/shared';
import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';

export default function ImageStudio() {
  const { t, date } = useI18n();
  const { can } = useAuth();
  const status = useQuery({ queryKey: ['img-status'], queryFn: () => api('/ai/images/status') });
  const jobs = useQuery({ queryKey: ['img-jobs'], queryFn: () => api<Paged<any>>('/ai/images/jobs') });
  const media = useQuery({ queryKey: ['media'], queryFn: () => api<Paged<any>>('/media', { query: { pageSize: 50 } }), enabled: Boolean(status.data?.available) });
  const [f, setF] = useState({ type: 'BACKGROUND_REMOVAL', sourceAssetId: '', prompt: '' });
  const run = useAction(() => api('/ai/images/jobs', { body: { ...f, prompt: f.prompt || null } }), { invalidate: [['img-jobs']], success: t('common.created') });

  return (
    <>
      <PageHeader title={t('images.title')} description={t('images.sub')} />
      <QueryState q={status}>
        {(s) => !s.available ? (
          <EmptyState icon={Plug} title={t('images.unavailable')} description={t('images.unavailableSub')} action={can('integrations:manage') && <Button asChild variant="outline"><Link href="/integrations">{t('nav.integrations')}</Link></Button>} />
        ) : (
          <Card className="mb-6">
            <CardContent className="grid gap-4 pt-5 sm:grid-cols-3">
              <Field label={t('images.type')}><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{IMAGE_JOB_TYPES.map((x) => <option key={x} value={x}>{t(`images.types.${x}`)}</option>)}</Select></Field>
              <Field label={t('images.source')}><Select value={f.sourceAssetId} onChange={(e) => setF({ ...f, sourceAssetId: e.target.value })}><option value="">—</option>{media.data?.items.map((m: any) => <option key={m.id} value={m.id}>{m.key.split('/').pop()}</option>)}</Select></Field>
              <Field label={t('images.prompt')}><Textarea rows={1} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} /></Field>
              <Button onClick={() => run.mutate(undefined)} loading={run.isPending} disabled={!f.sourceAssetId}>{t('images.run')}</Button>
            </CardContent>
          </Card>
        )}
      </QueryState>
      <Card className="mt-6">
        <CardHeader><CardTitle>{t('images.jobs')}</CardTitle></CardHeader>
        <CardContent>
          <QueryState q={jobs} isEmpty={(d) => d.items.length === 0} empty={<EmptyState icon={ImageIcon} title={t('marketing.empty')} />}>
            {(d) => (
              <Table>
                <THead><TR><TH>{t('common.date')}</TH><TH>{t('images.type')}</TH><TH>{t('common.status')}</TH><TH /></TR></THead>
                <TBody>{d.items.map((j) => <TR key={j.id}><TD className="text-xs">{date(j.createdAt, true)}</TD><TD>{t(`images.types.${j.type}`)}</TD><TD><StatusBadge ns="images.statuses" value={j.status} /></TD><TD className="text-xs text-red-700">{j.error}</TD></TR>)}</TBody>
              </Table>
            )}
          </QueryState>
        </CardContent>
      </Card>
    </>
  );
}
