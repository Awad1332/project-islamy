'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { FIT_PREFERENCES } from '@abaya/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader, Stat } from '@/components/page';
import { QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { RecommendationResult } from '@/components/customers/recommendation';

const KEYS = ['height', 'bust', 'waist', 'hips', 'shoulder', 'armLength'] as const;

export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, money, num, date } = useI18n();
  const { can } = useAuth();
  const router = useRouter();
  const q = useQuery({ queryKey: ['customer', id], queryFn: () => api(`/customers/${id}`) });
  const products = useQuery({ queryKey: ['products-pick'], queryFn: () => api('/products', { query: { status: 'ACTIVE', pageSize: 100 } }) });
  const [edit, setEdit] = useState(false);
  const [meas, setMeas] = useState<any>(null);
  const [note, setNote] = useState('');
  const [productId, setProductId] = useState('');
  const [rec, setRec] = useState<any>(null);
  const inv = [['customer', id]];
  const saveMeas = useAction((m: any) => {
    const body = { label: m.label || 'default', fitPreference: m.fitPreference, wearsHeels: m.wearsHeels, ...Object.fromEntries(KEYS.map((k) => [k, m[k] === '' || m[k] == null ? null : Number(m[k])])) };
    return m.id ? api(`/customers/${id}/measurements/${m.id}`, { method: 'PUT', body }) : api(`/customers/${id}/measurements`, { body });
  }, { invalidate: inv, onSuccess: () => setMeas(null) });
  const delMeas = useAction((mid: string) => api(`/customers/${id}/measurements/${mid}`, { method: 'DELETE' }), { invalidate: inv, success: t('common.deleted') });
  const addNote = useAction(() => api(`/customers/${id}/notes`, { body: { body: note } }), { invalidate: inv, onSuccess: () => setNote('') });
  const del = useAction(() => api(`/customers/${id}`, { method: 'DELETE' }), { success: t('common.deleted'), onSuccess: () => router.replace('/customers') });
  const recommend = useAction((mid: string) => api('/size-charts/recommend', { body: { productId, customerId: id, measurementId: mid } }), { success: false, onSuccess: setRec });

  return (
    <QueryState q={q}>
      {(c) => (
        <>
          <PageHeader title={c.fullName} description={[c.phone, c.email, c.city].filter(Boolean).join(' · ')}
            actions={can('customers:write') && <>
              <Button variant="outline" size="sm" onClick={() => setEdit(true)}><Pencil />{t('common.edit')}</Button>
              <Button variant="ghost" size="sm" onClick={() => confirm(t('common.confirmDelete')) && del.mutate(undefined)}><Trash2 /></Button>
            </>} />
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Stat label={t('customers.orders')} value={num(c.ordersCount)} />
            <Stat label={t('customers.spent')} value={money(c.totalSpent)} />
            <Stat label={t('customers.aov')} value={money(c.averageOrderValue)} />
            <Stat label={t('customers.returnsCount')} value={num(c.returnsCount)} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Ruler className="size-4 text-gold" />{t('customers.measurements')}</CardTitle>
                  {can('customers:write') && <Button size="sm" variant="outline" onClick={() => setMeas({ label: 'default', fitPreference: 'REGULAR', wearsHeels: false, ...Object.fromEntries(KEYS.map((k) => [k, ''])) })}><Plus />{t('customers.addMeasurement')}</Button>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {c.measurements.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
                  {c.measurements.map((m: any) => (
                    <div key={m.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="font-medium">{m.label} <Badge variant="secondary">{t(`customers.fits.${m.fitPreference}`)}</Badge> {m.wearsHeels && <Badge variant="outline">{t('customers.heels')}</Badge>}</div>
                        <div className="flex gap-1">
                          {can('customers:write') && <Button variant="ghost" size="icon" onClick={() => setMeas({ ...m, ...Object.fromEntries(KEYS.map((k) => [k, m[k] ?? ''])) })}><Pencil /></Button>}
                          {can('customers:write') && <Button variant="ghost" size="icon" onClick={() => delMeas.mutate(m.id)}><Trash2 /></Button>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
                        {KEYS.map((k) => <div key={k}><div className="text-xs text-muted-foreground">{t(`customers.${k}`)}</div><div className="num">{m[k] ?? '—'}</div></div>)}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Select className="h-9 max-w-xs" value={productId} onChange={(e) => setProductId(e.target.value)}>
                          <option value="">{t('ai.product')}…</option>
                          {products.data?.items.map((p: any) => <option key={p.id} value={p.id}>{p.titleAr}</option>)}
                        </Select>
                        <Button size="sm" variant="gold" disabled={!productId} loading={recommend.isPending} onClick={() => recommend.mutate(m.id)}>{t('customers.recommend')}</Button>
                      </div>
                    </div>
                  ))}
                  {rec && <RecommendationResult r={rec} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('customers.orders')}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <THead><TR><TH>#</TH><TH>{t('common.date')}</TH><TH>{t('common.total')}</TH><TH>{t('common.status')}</TH></TR></THead>
                    <TBody>
                      {c.orders.map((o: any) => (
                        <TR key={o.id}><TD><Link href={`/orders/${o.id}`} className="num text-gold-700">#{o.number}</Link></TD><TD className="text-xs">{date(o.placedAt)}</TD><TD className="num">{money(o.total)}</TD><TD><StatusBadge ns="orders.statuses" value={o.status} /></TD></TR>
                      ))}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-2 pt-5 text-sm">
                  <div className="flex flex-wrap gap-1">{c.tags.map((x: string) => <Badge key={x}>{x}</Badge>)}</div>
                  <p>{t('customers.acceptsMarketing')}: {c.acceptsMarketing ? t('common.yes') : t('common.no')}</p>
                  {c.birthday && <p>{t('customers.birthday')}: {date(c.birthday)}</p>}
                  {c.addressLine && <p>{[c.city, c.district, c.addressLine].filter(Boolean).join('، ')}</p>}
                  {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('customers.timeline')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {can('customers:write') && (
                    <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(undefined); }} className="space-y-2">
                      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                      <Button size="sm" type="submit" loading={addNote.isPending}>{t('customers.addNote')}</Button>
                    </form>
                  )}
                  {c.timeline.map((n: any) => <div key={n.id} className="rounded-md bg-muted p-2 text-sm"><p>{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{date(n.createdAt, true)}</p></div>)}
                </CardContent>
              </Card>
            </div>
          </div>
          {edit && <CustomerDialog open={edit} onOpenChange={setEdit} customer={c} />}
          <Dialog open={Boolean(meas)} onOpenChange={(v) => !v && setMeas(null)}>
            {meas && (
              <DialogContent wide title={t('customers.measurements')}>
                <form className="grid gap-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); saveMeas.mutate(meas); }}>
                  <Field label={t('customers.label')}><Input value={meas.label} onChange={(e) => setMeas({ ...meas, label: e.target.value })} /></Field>
                  {KEYS.map((k) => <Field key={k} label={t(`customers.${k}`)} error={saveMeas.errors[k]}><Input type="number" step="0.5" value={meas[k]} onChange={(e) => setMeas({ ...meas, [k]: e.target.value })} /></Field>)}
                  <Field label={t('customers.fit')}><Select value={meas.fitPreference} onChange={(e) => setMeas({ ...meas, fitPreference: e.target.value })}>{FIT_PREFERENCES.map((f) => <option key={f} value={f}>{t(`customers.fits.${f}`)}</option>)}</Select></Field>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm"><Switch checked={meas.wearsHeels} onCheckedChange={(v) => setMeas({ ...meas, wearsHeels: v })} />{t('customers.heels')}</label>
                  <div className="sm:col-span-3"><Button type="submit" loading={saveMeas.isPending}>{t('common.save')}</Button></div>
                </form>
              </DialogContent>
            )}
          </Dialog>
        </>
      )}
    </QueryState>
  );
}
