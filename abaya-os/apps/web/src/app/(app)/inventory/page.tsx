'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Boxes, MapPin, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader, Pagination } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

export default function InventoryPage() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t('inventory.title')} />
      <Tabs defaultValue="levels">
        <TabsList>
          <TabsTrigger value="levels">{t('inventory.levels')}</TabsTrigger>
          <TabsTrigger value="movements">{t('inventory.movements')}</TabsTrigger>
          <TabsTrigger value="locations">{t('inventory.locations')}</TabsTrigger>
        </TabsList>
        <TabsContent value="levels"><Levels /></TabsContent>
        <TabsContent value="movements"><Movements /></TabsContent>
        <TabsContent value="locations"><Locations /></TabsContent>
      </Tabs>
    </>
  );
}

function Levels() {
  const { t, num, locale } = useI18n();
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [low, setLow] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [page, setPage] = useState(1);
  const [adjust, setAdjust] = useState<any>(null);
  const [transfer, setTransfer] = useState<any>(null);
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api<any[]>('/locations') });
  const list = useQuery({ queryKey: ['inventory', q, low, locationId, page], queryFn: () => api<Paged<any> & { threshold: number }>('/inventory', { query: { q, lowStock: low ? 'true' : undefined, locationId, page } }) });
  const doAdjust = useAction((b: any) => api('/inventory/adjust', { body: b }), { invalidate: [['inventory'], ['movements']], onSuccess: () => setAdjust(null) });
  const doTransfer = useAction((b: any) => api('/inventory/transfer', { body: b }), { invalidate: [['inventory'], ['movements']], onSuccess: () => setTransfer(null) });
  const defaultLoc = locations.data?.find((l) => l.isDefault)?.id ?? locations.data?.[0]?.id ?? '';

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input className="max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select className="w-52" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">{t('common.all')}</option>
          {locations.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm"><Switch checked={low} onCheckedChange={(v) => { setLow(v); setPage(1); }} />{t('inventory.lowOnly')}</label>
      </div>
      <QueryState q={list} isEmpty={(d) => d.items.length === 0} empty={<EmptyState icon={Boxes} title={t('inventory.empty')} />}>
        {(d) => (
          <Card>
            <Table>
              <THead><TR><TH>{t('products.sku')}</TH><TH>{t('common.name')}</TH><TH>{t('products.size')} / {t('products.color')} / {t('products.length')}</TH><TH>{t('inventory.onHand')}</TH><TH /></TR></THead>
              <TBody>
                {d.items.map((v) => (
                  <TR key={v.id}>
                    <TD dir="ltr" className="text-xs">{v.sku}</TD>
                    <TD>{locale === 'en' && v.product.titleEn ? v.product.titleEn : v.product.titleAr}</TD>
                    <TD className="text-sm">{v.size} · {v.color}{v.length ? ` · ${v.length}″` : ''}</TD>
                    <TD><span className="num font-medium">{num(v.onHand)}</span> {v.low && <Badge variant="warning">{t('inventory.low')}</Badge>}
                      <div className="text-xs text-muted-foreground">{v.inventory.map((l: any) => `${l.location.name}: ${l.onHand}`).join(' · ')}</div>
                    </TD>
                    <TD className="text-end">{can('inventory:write') && (<>
                      <Button variant="ghost" size="sm" onClick={() => setAdjust({ variant: v, locationId: locationId || defaultLoc, type: 'RECEIPT', quantity: '', note: '' })}><SlidersHorizontal />{t('inventory.adjust')}</Button>
                      {(locations.data?.length ?? 0) > 1 && <Button variant="ghost" size="sm" onClick={() => setTransfer({ variant: v, fromLocationId: defaultLoc, toLocationId: locations.data?.find((l) => l.id !== defaultLoc)?.id, quantity: '', note: '' })}><ArrowLeftRight /></Button>}
                    </>)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="p-4"><Pagination page={d.page} pageCount={d.pageCount} total={d.total} onPage={setPage} /></div>
          </Card>
        )}
      </QueryState>

      <Dialog open={Boolean(adjust)} onOpenChange={(o) => !o && setAdjust(null)}>
        {adjust && (
          <DialogContent title={t('inventory.adjust')} description={`${adjust.variant.sku}`}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); doAdjust.mutate({ variantId: adjust.variant.id, locationId: adjust.locationId, type: adjust.type, quantity: Number(adjust.quantity), note: adjust.note || null }); }}>
              <Field label={t('inventory.type')}>
                <Select value={adjust.type} onChange={(e) => setAdjust({ ...adjust, type: e.target.value })}>
                  <option value="RECEIPT">{t('inventory.receipt')}</option>
                  <option value="ADJUSTMENT">{t('inventory.adjustment')}</option>
                </Select>
              </Field>
              <Field label={t('inventory.location')}>
                <Select value={adjust.locationId} onChange={(e) => setAdjust({ ...adjust, locationId: e.target.value })}>{locations.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
              </Field>
              <Field label={t('inventory.quantity')} hint={adjust.type === 'ADJUSTMENT' ? t('inventory.quantityHint') : undefined} error={doAdjust.errors.quantity}>
                <Input type="number" required min={adjust.type === 'RECEIPT' ? 1 : undefined} value={adjust.quantity} onChange={(e) => setAdjust({ ...adjust, quantity: e.target.value })} />
              </Field>
              <Field label={t('common.notes')}><Input value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} /></Field>
              <Button type="submit" loading={doAdjust.isPending}>{t('common.save')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={Boolean(transfer)} onOpenChange={(o) => !o && setTransfer(null)}>
        {transfer && (
          <DialogContent title={t('inventory.transfer')} description={transfer.variant.sku}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); doTransfer.mutate({ variantId: transfer.variant.id, fromLocationId: transfer.fromLocationId, toLocationId: transfer.toLocationId, quantity: Number(transfer.quantity), note: transfer.note || null }); }}>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('inventory.from')}><Select value={transfer.fromLocationId} onChange={(e) => setTransfer({ ...transfer, fromLocationId: e.target.value })}>{locations.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
                <Field label={t('inventory.to')} error={doTransfer.errors.toLocationId}><Select value={transfer.toLocationId} onChange={(e) => setTransfer({ ...transfer, toLocationId: e.target.value })}>{locations.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
              </div>
              <Field label={t('inventory.quantity')}><Input type="number" min={1} required value={transfer.quantity} onChange={(e) => setTransfer({ ...transfer, quantity: e.target.value })} /></Field>
              <Button type="submit" loading={doTransfer.isPending}>{t('common.save')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function Movements() {
  const { t, date, num } = useI18n();
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['movements', page], queryFn: () => api<Paged<any>>('/inventory/movements', { query: { page } }) });
  return (
    <QueryState q={q} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title={t('marketing.empty')} />}>
      {(d) => (
        <Card>
          <Table>
            <THead><TR><TH>{t('common.date')}</TH><TH>{t('products.sku')}</TH><TH>{t('inventory.type')}</TH><TH>{t('inventory.quantity')}</TH><TH>{t('inventory.balance')}</TH><TH>{t('inventory.location')}</TH><TH>{t('inventory.reference')}</TH></TR></THead>
            <TBody>
              {d.items.map((m) => (
                <TR key={m.id}>
                  <TD className="text-xs">{date(m.createdAt, true)}</TD>
                  <TD dir="ltr" className="text-xs">{m.sku}<div className="text-muted-foreground" dir="auto">{m.productTitle}</div></TD>
                  <TD>{t(`inventory.types.${m.type}`)}</TD>
                  <TD className={`num font-medium ${m.quantity < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{m.quantity > 0 ? '+' : ''}{num(m.quantity)}</TD>
                  <TD className="num">{num(m.balance)}</TD>
                  <TD>{m.locationName}</TD>
                  <TD className="text-xs">{m.reference ?? m.note ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="p-4"><Pagination page={d.page} pageCount={d.pageCount} total={d.total} onPage={setPage} /></div>
        </Card>
      )}
    </QueryState>
  );
}

function Locations() {
  const { t } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['locations'], queryFn: () => api<any[]>('/locations') });
  const [edit, setEdit] = useState<any>(null);
  const save = useAction((l: any) => (l.id ? api(`/locations/${l.id}`, { method: 'PUT', body: { name: l.name, city: l.city || null, isDefault: l.isDefault } }) : api('/locations', { body: { name: l.name, city: l.city || null, isDefault: l.isDefault } })), { invalidate: [['locations']], onSuccess: () => setEdit(null) });
  const del = useAction((id: string) => api(`/locations/${id}`, { method: 'DELETE' }), { invalidate: [['locations']], success: t('common.deleted') });
  return (
    <>
      {can('inventory:write') && <Button className="mb-4" onClick={() => setEdit({ name: '', city: '', isDefault: false })}><Plus />{t('inventory.newLocation')}</Button>}
      <QueryState q={q}>
        {(d) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.map((l) => (
              <Card key={l.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 font-medium"><MapPin className="size-4 text-gold" />{l.name}</div>
                  {l.isDefault && <Badge variant="gold">{t('inventory.default')}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{l.city ?? '—'}</p>
                {can('inventory:write') && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEdit({ ...l, city: l.city ?? '' })}>{t('common.edit')}</Button>
                    {!l.isDefault && <Button variant="ghost" size="sm" onClick={() => confirm(t('common.confirmDelete')) && del.mutate(l.id)}><Trash2 /></Button>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </QueryState>
      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        {edit && (
          <DialogContent title={edit.id ? t('common.edit') : t('inventory.newLocation')}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
              <Field label={t('common.name')} error={save.errors.name}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required /></Field>
              <Field label={t('inventory.city')}><Input value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm"><Switch checked={edit.isDefault} onCheckedChange={(v) => setEdit({ ...edit, isDefault: v })} />{t('inventory.default')}</label>
              <Button type="submit" loading={save.isPending}>{t('common.save')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
