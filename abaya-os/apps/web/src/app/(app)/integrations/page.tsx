'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, CircleDashed, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status';

export default function IntegrationsPage() {
  const { t, date } = useI18n();
  const q = useQuery({ queryKey: ['integrations'], queryFn: () => api<any[]>('/integrations') });
  const sys = useQuery({ queryKey: ['system-status'], queryFn: () => api('/system/status') });
  const [cfg, setCfg] = useState<any>(null);
  const save = useAction((c: any) => api('/integrations', { method: 'PUT', body: { provider: c.provider, credentials: c.values, settings: {} } }), { invalidate: [['integrations']], onSuccess: () => setCfg(null) });
  const verify = useAction((p: string) => api(`/integrations/${p}/verify`, { method: 'POST' }), {
    invalidate: [['integrations'], ['ai-status']], success: false,
    onSuccess: (r: any) => (r.verified ? toast.success(t('integrations.statuses.VERIFIED')) : toast.error(r.reason === 'VERIFICATION_NOT_IMPLEMENTED' ? t('integrations.noVerifier') : `${t('integrations.statuses.FAILED')}: ${r.reason ?? ''}`)),
  });
  const disconnect = useAction((p: string) => api(`/integrations/${p}`, { method: 'DELETE' }), { invalidate: [['integrations']], success: t('common.deleted') });

  return (
    <>
      <PageHeader title={t('integrations.title')} description={t('integrations.sub')} />
      {sys.data && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap gap-6 pt-5 text-sm">
            <span className="flex items-center gap-2">{sys.data.storage.reachable ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-red-600" />}S3 storage</span>
            <span className="flex items-center gap-2">{sys.data.platformAiKeyConfigured ? <CircleDashed className="size-4 text-gold" /> : <XCircle className="size-4 text-muted-foreground" />}Platform AI key</span>
            <span className="flex items-center gap-2"><XCircle className="size-4 text-muted-foreground" />Billing gateway</span>
            <span className="flex items-center gap-2"><XCircle className="size-4 text-muted-foreground" />ZATCA Phase 2</span>
          </CardContent>
        </Card>
      )}
      <QueryState q={q}>
        {(list) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((i) => (
              <Card key={i.provider} className={`flex flex-col p-5 ${i.connected ? 'border-emerald-200' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{t(`integrations.providers.${i.provider}`)}</div>
                    <div className="text-xs text-muted-foreground">{t(`integrations.categories.${i.category}`)}</div>
                  </div>
                  <StatusBadge ns="integrations.statuses" value={i.status} />
                </div>
                <div className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
                  {!i.verificationSupported && <p className="text-amber-800">{t('integrations.noVerifier')}</p>}
                  {i.capabilities.includes('credentials_verified_only') && <p>{t('integrations.credentialsOnly')}</p>}
                  {i.lastVerifiedAt && <p className="flex items-center gap-1"><ShieldCheck className="size-3" />{t('integrations.lastVerified')}: {date(i.lastVerifiedAt, true)}</p>}
                  {i.lastError && <p className="text-red-700">{i.lastError}</p>}
                  {Object.entries(i.maskedCredentials).map(([k, v]) => <p key={k} dir="ltr">{k}: {String(v)}</p>)}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCfg({ ...i, values: Object.fromEntries(i.fields.map((f: any) => [f.key, f.secret ? '' : i.maskedCredentials[f.key] ?? ''])) })}>{t('integrations.configure')}</Button>
                  {i.status !== 'NOT_CONFIGURED' && <Button size="sm" variant="gold" loading={verify.isPending && verify.variables === i.provider} onClick={() => verify.mutate(i.provider)}>{t('integrations.verify')}</Button>}
                  {i.status !== 'NOT_CONFIGURED' && <Button size="sm" variant="ghost" onClick={() => confirm(t('common.confirmDelete')) && disconnect.mutate(i.provider)}>{t('integrations.disconnect')}</Button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
      <Dialog open={Boolean(cfg)} onOpenChange={(v) => !v && setCfg(null)}>
        {cfg && (
          <DialogContent title={t(`integrations.providers.${cfg.provider}`)} description={cfg.docs || undefined}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(cfg); }}>
              {cfg.fields.map((f: any) => (
                <Field key={f.key} label={`${f.key}${f.required ? ' *' : ''}`} hint={f.secret && cfg.status !== 'NOT_CONFIGURED' ? t('integrations.keepSecret') : undefined} error={save.errors[`credentials.${f.key}`]}>
                  <Input dir="ltr" type={f.secret ? 'password' : 'text'} autoComplete="off" value={cfg.values[f.key]} onChange={(e) => setCfg({ ...cfg, values: { ...cfg.values, [f.key]: e.target.value } })} />
                </Field>
              ))}
              <Button type="submit" loading={save.isPending}>{t('common.save')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
