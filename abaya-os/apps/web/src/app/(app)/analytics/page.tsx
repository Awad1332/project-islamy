'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { PageHeader, Stat } from '@/components/page';
import { QueryState } from '@/components/states';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/charts/sales-chart';

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function AnalyticsPage() {
  const { t, money, num } = useI18n();
  const [from, setFrom] = useState(iso(new Date(Date.now() - 29 * 86400_000)));
  const [to, setTo] = useState(iso(new Date()));
  const q = useQuery({ queryKey: ['analytics', from, to], queryFn: () => api('/analytics/overview', { query: { from: `${from}T00:00:00+03:00`, to: `${to}T23:59:59+03:00` } }) });
  return (
    <>
      <PageHeader title={t('analytics.title')} description={t('analytics.tz')} actions={<div className="flex gap-2"><Field label={t('analytics.from')}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field><Field label={t('analytics.to')}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field></div>} />
      <QueryState q={q}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={t('analytics.revenue')} value={money(d.kpis.revenue)} />
              <Stat label={t('analytics.orders')} value={num(d.kpis.orders)} />
              <Stat label={t('analytics.aov')} value={money(d.kpis.averageOrderValue)} />
              <Stat label={t('analytics.vat')} value={money(d.kpis.vatCollected)} />
              <Stat label={t('analytics.refunded')} value={money(d.kpis.refunded)} />
              <Stat label={t('analytics.newCustomers')} value={num(d.kpis.newCustomers)} />
              <Stat label={t('analytics.returnRate')} value={`${(d.kpis.returnRate * 100).toFixed(1)}%`} />
              <Stat label={t('orders.statuses.CANCELLED')} value={num(d.kpis.cancelled)} />
            </div>
            <Card><CardHeader><CardTitle>{t('analytics.revenue')}</CardTitle></CardHeader><CardContent><SalesChart data={d.series} /></CardContent></Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>{t('analytics.topProducts')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {d.topProducts.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
                  {d.topProducts.map((p: any) => (
                    <div key={p.productId}>
                      <div className="flex justify-between text-sm"><span>{p.title}</span><span className="num">{num(p.units)} {t('analytics.units')} · {money(p.revenue)}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-beige-100"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.round(p.share * 100)}%` }} /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('analytics.sizes')}</CardTitle></CardHeader>
                <CardContent>
                  {d.sizes.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
                    <div className="h-64" dir="ltr">
                      <ResponsiveContainer>
                        <BarChart data={d.sizes.map((s: any) => ({ name: `${s.size}${s.length ? ` / ${s.length}″` : ''}`, units: s.units }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                          <Tooltip />
                          <Bar dataKey="units" fill="#B8975A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('analytics.channels')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">{d.byChannel.map((c: any) => <div key={c.channel} className="flex justify-between"><span>{t(`orders.channels.${c.channel}`)}</span><span className="num">{num(c.count)} · {money(c.revenue)}</span></div>)}</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('analytics.reasons')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {d.returnReasons.length === 0 && <p className="text-muted-foreground">—</p>}
                  {d.returnReasons.map((r: any) => <div key={r.reason} className="flex justify-between"><span>{t(`returns.reasons.${r.reason}`)}</span><span className="num">{num(r.count)}</span></div>)}
                  <div className="border-t pt-2 text-xs text-muted-foreground">{t('analytics.byStatus')}: {d.byStatus.map((s: any) => `${t(`orders.statuses.${s.status}`)} ${s.count}`).join(' · ')}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
