'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, ExternalLink, KeyRound, Plus, Send, Trash2, Webhook } from 'lucide-react';
import { WEBHOOK_EVENTS } from '@abaya/shared';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

const SCOPES = ['products:read', 'orders:read', 'orders:write', 'customers:read', 'inventory:read'];

function Secret({ value, note }: { value: string; note: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <p className="text-sm text-amber-900">{note}</p>
      <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-xs" dir="ltr"><code className="break-all">{value}</code><Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(value); toast.success(t('common.copied')); }}><Copy /></Button></div>
    </div>
  );
}

export default function DeveloperPage() {
  const { t, date } = useI18n();
  const keys = useQuery({ queryKey: ['api-keys'], queryFn: () => api<any[]>('/developer/api-keys') });
  const hooks = useQuery({ queryKey: ['webhooks'], queryFn: () => api<any[]>('/developer/webhooks') });
  const [newKey, setNewKey] = useState<{ name: string; scopes: string[] } | null>(null);
  const [newHook, setNewHook] = useState<{ url: string; events: string[] } | null>(null);
  const [secret, setSecret] = useState<{ value: string; note: string } | null>(null);
  const [deliveriesFor, setDeliveriesFor] = useState<string | null>(null);
  const createKey = useAction(() => api('/developer/api-keys', { body: newKey! }), { invalidate: [['api-keys']], success: false, onSuccess: (r: any) => { setNewKey(null); setSecret({ value: r.key, note: t('developer.keyOnce') }); } });
  const revokeKey = useAction((id: string) => api(`/developer/api-keys/${id}`, { method: 'DELETE' }), { invalidate: [['api-keys']] });
  const createHook = useAction(() => api('/developer/webhooks', { body: { ...newHook!, isActive: true } }), { invalidate: [['webhooks']], success: false, onSuccess: (r: any) => { setNewHook(null); setSecret({ value: r.secret, note: t('developer.secretOnce') }); } });
  const delHook = useAction((id: string) => api(`/developer/webhooks/${id}`, { method: 'DELETE' }), { invalidate: [['webhooks']], success: t('common.deleted') });
  const test = useAction((id: string) => api(`/developer/webhooks/${id}/test`, { method: 'POST' }), { success: false, onSuccess: (r: any) => (r.status === 'SUCCEEDED' ? toast.success(`HTTP ${r.responseCode}`) : toast.error(r.error ?? 'failed')) });
  const deliveries = useQuery({ queryKey: ['deliveries', deliveriesFor], queryFn: () => api<any[]>(`/developer/webhooks/${deliveriesFor}/deliveries`), enabled: Boolean(deliveriesFor) });
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <>
      <PageHeader title={t('developer.title')} actions={<Button asChild variant="outline"><a href="/api/docs" target="_blank" rel="noreferrer"><ExternalLink />{t('developer.docs')}</a></Button>} />
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>{t('developer.apiKeys')}</CardTitle><Button size="sm" onClick={() => setNewKey({ name: '', scopes: ['products:read'] })}><Plus />{t('developer.newKey')}</Button></CardHeader>
          <CardContent className="p-0">
            <QueryState q={keys} isEmpty={(d) => d.length === 0} empty={<div className="p-5"><EmptyState icon={KeyRound} title={t('marketing.empty')} /></div>}>
              {(d) => (
                <Table>
                  <THead><TR><TH>{t('common.name')}</TH><TH>prefix</TH><TH>{t('developer.scopes')}</TH><TH>{t('developer.lastUsed')}</TH><TH /></TR></THead>
                  <TBody>{d.map((k) => (
                    <TR key={k.id} className={k.revokedAt ? 'opacity-50' : ''}>
                      <TD>{k.name}</TD><TD dir="ltr" className="text-xs">{k.prefix}…</TD>
                      <TD>{k.scopes.map((s: string) => <Badge key={s} className="me-1">{s}</Badge>)}</TD>
                      <TD className="text-xs">{k.lastUsedAt ? date(k.lastUsedAt, true) : '—'}</TD>
                      <TD>{k.revokedAt ? <Badge variant="outline">{t('developer.revoked')}</Badge> : <Button size="sm" variant="ghost" onClick={() => confirm(t('common.confirmDelete')) && revokeKey.mutate(k.id)}>{t('developer.revoke')}</Button>}</TD>
                    </TR>
                  ))}</TBody>
                </Table>
              )}
            </QueryState>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>{t('developer.webhooks')}</CardTitle><Button size="sm" onClick={() => setNewHook({ url: 'https://', events: ['order.created'] })}><Plus />{t('developer.newWebhook')}</Button></CardHeader>
          <CardContent className="p-0">
            <QueryState q={hooks} isEmpty={(d) => d.length === 0} empty={<div className="p-5"><EmptyState icon={Webhook} title={t('marketing.empty')} /></div>}>
              {(d) => (
                <Table>
                  <THead><TR><TH>{t('developer.url')}</TH><TH>{t('developer.events')}</TH><TH /></TR></THead>
                  <TBody>{d.map((w) => (
                    <TR key={w.id}>
                      <TD dir="ltr" className="max-w-xs truncate text-xs">{w.url}</TD>
                      <TD>{w.events.map((e: string) => <Badge key={e} className="me-1">{e}</Badge>)}</TD>
                      <TD className="whitespace-nowrap text-end">
                        <Button size="sm" variant="ghost" onClick={() => test.mutate(w.id)} loading={test.isPending && test.variables === w.id}><Send />{t('developer.test')}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeliveriesFor(w.id)}>{t('developer.deliveries')}</Button>
                        <Button size="icon" variant="ghost" onClick={() => confirm(t('common.confirmDelete')) && delHook.mutate(w.id)}><Trash2 /></Button>
                      </TD>
                    </TR>
                  ))}</TBody>
                </Table>
              )}
            </QueryState>
          </CardContent>
        </Card>
      </div>
      <Dialog open={Boolean(newKey)} onOpenChange={(v) => !v && setNewKey(null)}>
        {newKey && (
          <DialogContent title={t('developer.newKey')}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createKey.mutate(undefined); }}>
              <Field label={t('common.name')}><Input required value={newKey.name} onChange={(e) => setNewKey({ ...newKey, name: e.target.value })} /></Field>
              <div><Label>{t('developer.scopes')}</Label><div className="mt-2 flex flex-wrap gap-2">{SCOPES.map((s) => <button type="button" key={s} onClick={() => setNewKey({ ...newKey, scopes: toggle(newKey.scopes, s) })} className={`rounded-full border px-3 py-1 text-xs ${newKey.scopes.includes(s) ? 'border-gold bg-gold-100' : ''}`}>{s}</button>)}</div></div>
              <Button type="submit" loading={createKey.isPending}>{t('common.create')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={Boolean(newHook)} onOpenChange={(v) => !v && setNewHook(null)}>
        {newHook && (
          <DialogContent title={t('developer.newWebhook')}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createHook.mutate(undefined); }}>
              <Field label={t('developer.url')} error={createHook.errors.url}><Input dir="ltr" required value={newHook.url} onChange={(e) => setNewHook({ ...newHook, url: e.target.value })} /></Field>
              <div><Label>{t('developer.events')}</Label><div className="mt-2 flex flex-wrap gap-2">{WEBHOOK_EVENTS.map((s) => <button type="button" key={s} onClick={() => setNewHook({ ...newHook, events: toggle(newHook.events, s) })} className={`rounded-full border px-3 py-1 text-xs ${newHook.events.includes(s) ? 'border-gold bg-gold-100' : ''}`}>{s}</button>)}</div></div>
              <Button type="submit" loading={createHook.isPending}>{t('common.create')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={Boolean(secret)} onOpenChange={(v) => !v && setSecret(null)}>
        {secret && <DialogContent title={t('common.copy')}><Secret value={secret.value} note={secret.note} /></DialogContent>}
      </Dialog>
      <Dialog open={Boolean(deliveriesFor)} onOpenChange={(v) => !v && setDeliveriesFor(null)}>
        {deliveriesFor && (
          <DialogContent wide title={t('developer.deliveries')}>
            <QueryState q={deliveries} isEmpty={(d) => d.length === 0} empty={<p className="text-sm text-muted-foreground">—</p>}>
              {(d) => <Table><TBody>{d.map((x) => <TR key={x.id}><TD className="text-xs">{date(x.createdAt, true)}</TD><TD>{x.event}</TD><TD><Badge variant={x.status === 'SUCCEEDED' ? 'success' : x.status === 'FAILED' ? 'danger' : 'secondary'}>{x.status}</Badge></TD><TD className="num text-xs">{x.responseCode ?? ''} {x.error ?? ''}</TD><TD className="num text-xs">×{x.attempts}</TD></TR>)}</TBody></Table>}
            </QueryState>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
