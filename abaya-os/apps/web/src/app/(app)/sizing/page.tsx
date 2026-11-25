'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Ruler, Star, Trash2, X } from 'lucide-react';
import { FIT_PREFERENCES, MEASUREMENT_KEYS } from '@abaya/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { RecommendationResult } from '@/components/customers/recommendation';

type Chart = { id?: string; name: string; isDefault: boolean; weights: Record<string, number>; rows: { label: string; ranges: Record<string, { min: number; max: number }> }[]; lengthRows: { label: string; heightMin: number; heightMax: number }[]; heelAllowanceCm: number };
const blank = (): Chart => ({
  name: '', isDefault: false, heelAllowanceCm: 5, weights: { bust: 3, shoulder: 2, hips: 2 },
  rows: [{ label: 'S', ranges: { bust: { min: 80, max: 88 }, shoulder: { min: 35, max: 38 }, hips: { min: 86, max: 95 } } }, { label: 'M', ranges: { bust: { min: 89, max: 96 }, shoulder: { min: 38.5, max: 40 }, hips: { min: 96, max: 104 } } }],
  lengthRows: [{ label: '54', heightMin: 152, heightMax: 157 }, { label: '56', heightMin: 158, heightMax: 163 }],
});

export default function SizingPage() {
  const { t, num } = useI18n();
  const { can } = useAuth();
  const list = useQuery({ queryKey: ['size-charts'], queryFn: () => api<any[]>('/size-charts') });
  const [chart, setChart] = useState<Chart | null>(null);
  const save = useAction((c: Chart) => (c.id ? api(`/size-charts/${c.id}`, { method: 'PUT', body: strip(c) }) : api('/size-charts', { body: strip(c) })), { invalidate: [['size-charts']], onSuccess: (r: any) => setChart(toChart(r)) });
  const del = useAction((id: string) => api(`/size-charts/${id}`, { method: 'DELETE' }), { invalidate: [['size-charts']], success: t('common.deleted'), onSuccess: () => setChart(null) });
  const keys = MEASUREMENT_KEYS.filter((k) => (chart?.weights[k] ?? 0) > 0);

  return (
    <>
      <PageHeader title={t('sizing.title')} actions={can('catalog:write') && <Button onClick={() => setChart(blank())}><Plus />{t('sizing.new')}</Button>} />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-2">
          <QueryState q={list} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={Ruler} title={t('sizing.empty')} description={t('sizing.emptySub')} />}>
            {(d) => d.map((c) => (
              <button key={c.id} onClick={() => setChart(toChart(c))} className={`flex w-full items-center justify-between rounded-lg border bg-card p-3 text-start text-sm shadow-soft hover:border-gold ${chart?.id === c.id ? 'border-gold' : ''}`}>
                <span>{c.isDefault && <Star className="me-1 inline size-3 fill-gold text-gold" />}{c.name}</span>
                <span className="text-xs text-muted-foreground">{num(c._count.products)} {t('nav.products')}</span>
              </button>
            ))}
          </QueryState>
        </div>
        <div className="space-y-6 lg:col-span-3">
          {chart && (
            <Card>
              <CardContent className="space-y-5 pt-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={t('sizing.name')} error={save.errors.name}><Input value={chart.name} onChange={(e) => setChart({ ...chart, name: e.target.value })} /></Field>
                  <Field label={t('sizing.heel')}><Input type="number" step="0.5" value={chart.heelAllowanceCm} onChange={(e) => setChart({ ...chart, heelAllowanceCm: Number(e.target.value) })} /></Field>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm"><Switch checked={chart.isDefault} onCheckedChange={(v) => setChart({ ...chart, isDefault: v })} />{t('sizing.isDefault')}</label>
                </div>
                <div>
                  <Label>{t('sizing.weights')}</Label>
                  <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {MEASUREMENT_KEYS.map((k) => (
                      <Field key={k} label={t(`customers.${k}`).replace(/\s*\(.*\)/, '')}>
                        <Input type="number" min={0} max={10} value={chart.weights[k] ?? 0} onChange={(e) => setChart({ ...chart, weights: { ...chart.weights, [k]: Number(e.target.value) } })} />
                      </Field>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>{t('sizing.rows')} (cm)</Label>
                  <Table>
                    <THead><TR><TH>{t('sizing.label')}</TH>{keys.map((k) => <TH key={k}>{t(`customers.${k}`).replace(/\s*\(.*\)/, '')}</TH>)}<TH /></TR></THead>
                    <TBody>
                      {chart.rows.map((r, i) => (
                        <TR key={i}>
                          <TD><Input className="h-8 w-16" value={r.label} onChange={(e) => setChart({ ...chart, rows: chart.rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} /></TD>
                          {keys.map((k) => (
                            <TD key={k}>
                              <div className="flex items-center gap-1" dir="ltr">
                                {(['min', 'max'] as const).map((b) => (
                                  <Input key={b} type="number" step="0.5" className="h-8 w-16 text-xs" placeholder={b} value={r.ranges[k]?.[b] ?? ''}
                                    onChange={(e) => setChart({ ...chart, rows: chart.rows.map((x, j) => (j === i ? { ...x, ranges: { ...x.ranges, [k]: { min: x.ranges[k]?.min ?? 0, max: x.ranges[k]?.max ?? 0, [b]: Number(e.target.value) } } } : x)) })} />
                                ))}
                              </div>
                            </TD>
                          ))}
                          <TD><Button variant="ghost" size="icon" onClick={() => setChart({ ...chart, rows: chart.rows.filter((_, j) => j !== i) })}><X /></Button></TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setChart({ ...chart, rows: [...chart.rows, { label: '', ranges: {} }] })}>{t('sizing.addRow')}</Button>
                </div>
                <div>
                  <Label>{t('sizing.lengthRows')}</Label>
                  <div className="mt-2 space-y-2">
                    {chart.lengthRows.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input className="h-8 w-20" placeholder="56" value={r.label} onChange={(e) => setChart({ ...chart, lengthRows: chart.lengthRows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                        <span className="text-xs text-muted-foreground">{t('sizing.heightMin')}</span>
                        <Input type="number" className="h-8 w-20" value={r.heightMin} onChange={(e) => setChart({ ...chart, lengthRows: chart.lengthRows.map((x, j) => (j === i ? { ...x, heightMin: Number(e.target.value) } : x)) })} />
                        <span className="text-xs text-muted-foreground">{t('sizing.heightMax')}</span>
                        <Input type="number" className="h-8 w-20" value={r.heightMax} onChange={(e) => setChart({ ...chart, lengthRows: chart.lengthRows.map((x, j) => (j === i ? { ...x, heightMax: Number(e.target.value) } : x)) })} />
                        <Button variant="ghost" size="icon" onClick={() => setChart({ ...chart, lengthRows: chart.lengthRows.filter((_, j) => j !== i) })}><X /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setChart({ ...chart, lengthRows: [...chart.lengthRows, { label: '', heightMin: 150, heightMax: 155 }] })}>{t('sizing.addLength')}</Button>
                  </div>
                </div>
                {Object.keys(save.errors).length > 0 && <p className="text-sm text-destructive">{Object.values(save.errors).join(' · ')}</p>}
                {can('catalog:write') && (
                  <div className="flex gap-2">
                    <Button onClick={() => save.mutate(chart)} loading={save.isPending}>{t('common.save')}</Button>
                    {chart.id && <Button variant="ghost" onClick={() => confirm(t('common.confirmDelete')) && del.mutate(chart.id!)}><Trash2 /></Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {chart?.id && <Tester chartId={chart.id} />}
        </div>
      </div>
    </>
  );
}

function Tester({ chartId }: { chartId: string }) {
  const { t } = useI18n();
  const [m, setM] = useState<Record<string, string>>({ height: '160', bust: '92', hips: '100', shoulder: '39' });
  const [fit, setFit] = useState('REGULAR');
  const [heels, setHeels] = useState(false);
  const run = useAction(() => api('/size-charts/recommend', {
    body: { sizeChartId: chartId, measurements: { fitPreference: fit, wearsHeels: heels, ...Object.fromEntries(Object.entries(m).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])) } },
  }), { success: false });
  return (
    <Card>
      <CardHeader><CardTitle>{t('sizing.tester')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {MEASUREMENT_KEYS.map((k) => <Field key={k} label={t(`customers.${k}`)}><Input type="number" value={m[k] ?? ''} onChange={(e) => setM({ ...m, [k]: e.target.value })} /></Field>)}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select className="w-40" value={fit} onChange={(e) => setFit(e.target.value)}>{FIT_PREFERENCES.map((f) => <option key={f} value={f}>{t(`customers.fits.${f}`)}</option>)}</Select>
          <label className="flex items-center gap-2 text-sm"><Switch checked={heels} onCheckedChange={setHeels} />{t('customers.heels')}</label>
          <Button variant="gold" onClick={() => run.mutate(undefined)} loading={run.isPending}>{t('customers.recommend')}</Button>
        </div>
        {run.data && <RecommendationResult r={run.data} />}
      </CardContent>
    </Card>
  );
}

function toChart(c: any): Chart {
  return { id: c.id, name: c.name, isDefault: c.isDefault, weights: c.weights, rows: c.rows, lengthRows: c.lengthRows, heelAllowanceCm: c.heelAllowanceCm };
}
function strip(c: Chart) {
  const weights = Object.fromEntries(Object.entries(c.weights).filter(([, w]) => w > 0));
  const keys = Object.keys(weights);
  return { ...c, id: undefined, weights, rows: c.rows.map((r) => ({ label: r.label, ranges: Object.fromEntries(Object.entries(r.ranges).filter(([k]) => keys.includes(k))) })) };
}
