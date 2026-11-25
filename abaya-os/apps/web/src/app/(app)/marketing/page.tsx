'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { AUTOMATION_TRIGGERS, CAMPAIGN_CHANNELS } from '@abaya/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { toHalalas } from '@/lib/utils';
import { PageHeader } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';

export default function MarketingPage() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t('marketing.title')} description={t('marketing.consent')} />
      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">{t('marketing.campaigns')}</TabsTrigger>
          <TabsTrigger value="segments">{t('marketing.segments')}</TabsTrigger>
          <TabsTrigger value="automations">{t('marketing.automations')}</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns"><Campaigns /></TabsContent>
        <TabsContent value="segments"><Segments /></TabsContent>
        <TabsContent value="automations"><Automations /></TabsContent>
      </Tabs>
    </>
  );
}

function ChannelWarning({ channels, channel }: { channels?: Record<string, boolean>; channel: string }) {
  const { t } = useI18n();
  if (!channels || channels[channel]) return null;
  return <p className="flex items-center gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900"><AlertTriangle className="size-4" />{t('marketing.channelOff')}</p>;
}

function Segments() {
  const { t, num } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['segments'], queryFn: () => api<any[]>('/marketing/segments') });
  const [edit, setEdit] = useState<any>(null);
  const rules = (e: any) => {
    const r: Record<string, unknown> = {};
    for (const k of ['minOrders', 'maxOrders', 'lastOrderWithinDays', 'noOrderForDays']) if (e[k] !== '' && e[k] != null) r[k] = Number(e[k]);
    if (e.minSpent) r.minSpent = toHalalas(e.minSpent);
    if (e.cities) r.cities = e.cities.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean);
    if (e.tags) r.tags = e.tags.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean);
    return r;
  };
  const preview = useAction((e: any) => api('/marketing/segments/preview', { body: rules(e) }), { success: false });
  const save = useAction((e: any) => (e.id ? api(`/marketing/segments/${e.id}`, { method: 'PUT', body: { name: e.name, description: e.description || null, rules: rules(e) } }) : api('/marketing/segments', { body: { name: e.name, description: e.description || null, rules: rules(e) } })), { invalidate: [['segments']], onSuccess: () => setEdit(null) });
  const del = useAction((id: string) => api(`/marketing/segments/${id}`, { method: 'DELETE' }), { invalidate: [['segments']], success: t('common.deleted') });
  const open = (s?: any) => setEdit({ id: s?.id, name: s?.name ?? '', description: s?.description ?? '', minOrders: s?.rules.minOrders ?? '', maxOrders: s?.rules.maxOrders ?? '', minSpent: s?.rules.minSpent ? s.rules.minSpent / 100 : '', lastOrderWithinDays: s?.rules.lastOrderWithinDays ?? '', noOrderForDays: s?.rules.noOrderForDays ?? '', cities: (s?.rules.cities ?? []).join(', '), tags: (s?.rules.tags ?? []).join(', ') });

  return (
    <>
      {can('marketing:write') && <Button className="mb-4" onClick={() => open()}><Plus />{t('marketing.newSegment')}</Button>}
      <QueryState q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t('marketing.empty')} />}>
        {(d) => (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {d.map((s) => (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="font-medium">{s.name}</div>
                  {can('marketing:write') && <div><Button variant="ghost" size="icon" onClick={() => open(s)}><Pencil /></Button><Button variant="ghost" size="icon" onClick={() => confirm(t('common.confirmDelete')) && del.mutate(s.id)}><Trash2 /></Button></div>}
                </div>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                <div className="mt-3 flex gap-2"><Badge>{num(s.customerCount)} {t('marketing.customers')}</Badge><Badge variant="gold">{num(s.reachableCount)} {t('marketing.reachable')}</Badge></div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
      <Dialog open={Boolean(edit)} onOpenChange={(v) => !v && setEdit(null)}>
        {edit && (
          <DialogContent wide title={edit.id ? t('common.edit') : t('marketing.newSegment')}>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
              <Field label={t('common.name')} error={save.errors.name}><Input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label={t('common.details')}><Input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              {(['minOrders', 'maxOrders', 'minSpent', 'lastOrderWithinDays', 'noOrderForDays'] as const).map((k) => <Field key={k} label={t(`marketing.${k}`)}><Input type="number" min={0} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></Field>)}
              <Field label={t('marketing.cities')} hint={t('products.tagsHint')}><Input value={edit.cities} onChange={(e) => setEdit({ ...edit, cities: e.target.value })} /></Field>
              <Field label={t('marketing.tags')} hint={t('products.tagsHint')}><Input value={edit.tags} onChange={(e) => setEdit({ ...edit, tags: e.target.value })} /></Field>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => preview.mutate(edit)} loading={preview.isPending}>{t('marketing.preview')}</Button>
                {preview.data && <span className="text-sm">{num(preview.data.count)} {t('marketing.customers')} · {num(preview.data.reachable)} {t('marketing.reachable')}</span>}
              </div>
              <div className="sm:col-span-2"><Button type="submit" loading={save.isPending}>{t('common.save')}</Button></div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function Campaigns() {
  const { t, num, date } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['campaigns'], queryFn: () => api('/marketing/campaigns') });
  const segments = useQuery({ queryKey: ['segments'], queryFn: () => api<any[]>('/marketing/segments') });
  const [edit, setEdit] = useState<any>(null);
  const body = (e: any) => ({ name: e.name, channel: e.channel, segmentId: e.segmentId, subject: e.subject || null, bodyAr: e.bodyAr, bodyEn: e.bodyEn || null, scheduledAt: null });
  const save = useAction((e: any) => (e.id ? api(`/marketing/campaigns/${e.id}`, { method: 'PUT', body: body(e) }) : api('/marketing/campaigns', { body: body(e) })), { invalidate: [['campaigns']], onSuccess: () => setEdit(null) });
  const launch = useAction((p: { id: string; scheduleAt?: string }) => api(`/marketing/campaigns/${p.id}/launch`, { body: { scheduleAt: p.scheduleAt || null } }), { invalidate: [['campaigns']] });
  const cancel = useAction((id: string) => api(`/marketing/campaigns/${id}/cancel`, { method: 'POST' }), { invalidate: [['campaigns']] });
  const del = useAction((id: string) => api(`/marketing/campaigns/${id}`, { method: 'DELETE' }), { invalidate: [['campaigns']], success: t('common.deleted') });

  return (
    <>
      {can('marketing:write') && <Button className="mb-4" disabled={!segments.data?.length} onClick={() => setEdit({ name: '', channel: 'WHATSAPP', segmentId: segments.data?.[0]?.id ?? '', subject: '', bodyAr: '', bodyEn: '', scheduleAt: '' })}><Plus />{t('marketing.newCampaign')}</Button>}
      <QueryState q={q} isEmpty={(d: any) => d.items.length === 0} empty={<EmptyState title={t('marketing.empty')} />}>
        {(d: any) => (
          <Card>
            <Table>
              <THead><TR><TH>{t('common.name')}</TH><TH>{t('marketing.channel')}</TH><TH>{t('marketing.segment')}</TH><TH>{t('common.status')}</TH><TH>{t('marketing.sent')}/{t('marketing.recipients')}</TH><TH /></TR></THead>
              <TBody>
                {d.items.map((c: any) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}{c.scheduledAt && <div className="text-xs text-muted-foreground">{date(c.scheduledAt, true)}</div>}{c.lastError && <div className="text-xs text-red-700">{c.lastError}</div>}</TD>
                    <TD>{t(`marketing.channels.${c.channel}`)} {!d.channels[c.channel] && <Badge variant="warning">{t('common.notConnected')}</Badge>}</TD>
                    <TD>{c.segment.name}</TD>
                    <TD><StatusBadge ns="marketing.statuses" value={c.status} /></TD>
                    <TD className="num">{num(c.sentCount)}/{num(c.recipientCount)}</TD>
                    <TD className="text-end">{can('marketing:write') && (<>
                      {['DRAFT', 'FAILED'].includes(c.status) && <Button size="sm" variant="gold" disabled={!d.channels[c.channel]} onClick={() => launch.mutate({ id: c.id })}><Send />{t('marketing.launch')}</Button>}
                      {c.status === 'SCHEDULED' && <Button size="sm" variant="outline" onClick={() => cancel.mutate(c.id)}>{t('common.cancel')}</Button>}
                      {['DRAFT', 'SCHEDULED'].includes(c.status) && <Button size="icon" variant="ghost" onClick={() => setEdit({ ...c, subject: c.subject ?? '', bodyEn: c.bodyEn ?? '', scheduleAt: '' })}><Pencil /></Button>}
                      {c.status !== 'SENDING' && <Button size="icon" variant="ghost" onClick={() => confirm(t('common.confirmDelete')) && del.mutate(c.id)}><Trash2 /></Button>}
                    </>)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </QueryState>
      <Dialog open={Boolean(edit)} onOpenChange={(v) => !v && setEdit(null)}>
        {edit && (
          <DialogContent wide title={edit.id ? t('common.edit') : t('marketing.newCampaign')}>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
              <Field label={t('common.name')} error={save.errors.name}><Input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label={t('marketing.channel')}><Select value={edit.channel} onChange={(e) => setEdit({ ...edit, channel: e.target.value })}>{CAMPAIGN_CHANNELS.map((c) => <option key={c} value={c}>{t(`marketing.channels.${c}`)}</option>)}</Select></Field>
              <Field label={t('marketing.segment')}><Select value={edit.segmentId} onChange={(e) => setEdit({ ...edit, segmentId: e.target.value })}>{segments.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
              {edit.channel === 'EMAIL' && <Field label={t('marketing.subject')}><Input value={edit.subject} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} /></Field>}
              <Field label={`${t('marketing.body')} (AR)`} hint={t('marketing.bodyHint')} className="sm:col-span-2" error={save.errors.bodyAr}><Textarea rows={4} required value={edit.bodyAr} onChange={(e) => setEdit({ ...edit, bodyAr: e.target.value })} /></Field>
              <Field label={`${t('marketing.body')} (EN)`} className="sm:col-span-2"><Textarea rows={3} dir="ltr" value={edit.bodyEn} onChange={(e) => setEdit({ ...edit, bodyEn: e.target.value })} /></Field>
              <div className="sm:col-span-2"><ChannelWarning channels={(q.data as any)?.channels} channel={edit.channel} /></div>
              <div className="sm:col-span-2"><Button type="submit" loading={save.isPending}>{t('common.save')}</Button></div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function Automations() {
  const { t, date } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['automations'], queryFn: () => api('/marketing/automations') });
  const [edit, setEdit] = useState<any>(null);
  const body = (e: any) => ({ name: e.name, trigger: e.trigger, channel: e.channel, delayMinutes: Number(e.delayMinutes), bodyAr: e.bodyAr, bodyEn: e.bodyEn || null, isActive: e.isActive });
  const save = useAction((e: any) => (e.id ? api(`/marketing/automations/${e.id}`, { method: 'PUT', body: body(e) }) : api('/marketing/automations', { body: body(e) })), { invalidate: [['automations']], onSuccess: () => setEdit(null) });
  const toggle = useAction((a: any) => api(`/marketing/automations/${a.id}`, { method: 'PUT', body: body({ ...a, isActive: !a.isActive }) }), { invalidate: [['automations']] });
  const del = useAction((id: string) => api(`/marketing/automations/${id}`, { method: 'DELETE' }), { invalidate: [['automations']], success: t('common.deleted') });

  return (
    <>
      {can('marketing:write') && <Button className="mb-4" onClick={() => setEdit({ name: '', trigger: 'ORDER_DELIVERED', channel: 'WHATSAPP', delayMinutes: 1440, bodyAr: 'أهلاً {{name}}، نتمنى أن تنال عبايتكِ من {{store}} إعجابكِ 🤍', bodyEn: '', isActive: false })}><Plus />{t('marketing.newAutomation')}</Button>}
      <QueryState q={q}>
        {(d: any) => (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {d.items.length === 0 && <EmptyState title={t('marketing.empty')} />}
              {d.items.map((a: any) => (
                <Card key={a.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{t(`marketing.triggers.${a.trigger}`)} · {t(`marketing.channels.${a.channel}`)} · {a.delayMinutes}′</div>
                    </div>
                    {can('marketing:write') && <div className="flex items-center gap-1"><Switch checked={a.isActive} onCheckedChange={() => toggle.mutate(a)} /><Button variant="ghost" size="icon" onClick={() => setEdit({ ...a, bodyEn: a.bodyEn ?? '' })}><Pencil /></Button><Button variant="ghost" size="icon" onClick={() => confirm(t('common.confirmDelete')) && del.mutate(a.id)}><Trash2 /></Button></div>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{a.bodyAr}</p>
                  {!d.channels[a.channel] && <div className="mt-2"><ChannelWarning channels={d.channels} channel={a.channel} /></div>}
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle>{t('marketing.runs')}</CardTitle></CardHeader>
              <CardContent>
                {d.runs.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
                  <Table>
                    <TBody>{d.runs.map((r: any) => <TR key={r.id}><TD className="text-xs">{date(r.createdAt, true)}</TD><TD className="text-sm">{r.automation.name}</TD><TD><StatusBadge ns="marketing.runStatuses" value={r.status} /></TD><TD className="text-xs text-muted-foreground">{r.detail}</TD></TR>)}</TBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </QueryState>
      <Dialog open={Boolean(edit)} onOpenChange={(v) => !v && setEdit(null)}>
        {edit && (
          <DialogContent wide title={edit.id ? t('common.edit') : t('marketing.newAutomation')}>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
              <Field label={t('common.name')}><Input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label={t('marketing.trigger')}><Select value={edit.trigger} onChange={(e) => setEdit({ ...edit, trigger: e.target.value })}>{AUTOMATION_TRIGGERS.map((x) => <option key={x} value={x}>{t(`marketing.triggers.${x}`)}</option>)}</Select></Field>
              <Field label={t('marketing.channel')}><Select value={edit.channel} onChange={(e) => setEdit({ ...edit, channel: e.target.value })}>{CAMPAIGN_CHANNELS.map((c) => <option key={c} value={c}>{t(`marketing.channels.${c}`)}</option>)}</Select></Field>
              <Field label={t('marketing.delay')}><Input type="number" min={0} value={edit.delayMinutes} onChange={(e) => setEdit({ ...edit, delayMinutes: e.target.value })} /></Field>
              <Field label={`${t('marketing.body')} (AR)`} hint={t('marketing.bodyHint')} className="sm:col-span-2"><Textarea rows={3} required value={edit.bodyAr} onChange={(e) => setEdit({ ...edit, bodyAr: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm"><Switch checked={edit.isActive} onCheckedChange={(v) => setEdit({ ...edit, isActive: v })} />{t('common.active')}</label>
              <div className="sm:col-span-2"><ChannelWarning channels={(q.data as any)?.channels} channel={edit.channel} /></div>
              <div className="sm:col-span-2"><Button type="submit" loading={save.isPending}>{t('common.save')}</Button></div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
