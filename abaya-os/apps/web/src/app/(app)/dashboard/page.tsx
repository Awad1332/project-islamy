'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Circle, Inbox, PackageOpen, ShoppingBag, Undo2, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader, Stat } from '@/components/page';
import { QueryState } from '@/components/states';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';
import { SalesChart } from '@/components/charts/sales-chart';

export default function Dashboard() {
  const { t, money, num, date } = useI18n();
  const { me, can } = useAuth();
  const dash = useQuery({ queryKey: ['dashboard'], queryFn: () => api('/analytics/dashboard'), enabled: can('orders:read') });
  const onboarding = useQuery({ queryKey: ['onboarding'], queryFn: () => api('/onboarding') });
  const dismiss = useAction(() => api('/onboarding/dismiss', { body: { dismissed: true } }), { invalidate: [['onboarding']], success: false });

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.title')} description={me?.user.fullName} />

      {onboarding.data && !onboarding.data.dismissed && onboarding.data.completed < onboarding.data.total && (
        <Card className="border-gold-300 bg-gradient-to-l from-gold-100/60 to-card">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="font-display text-lg">{t('dashboard.onboarding')}</CardTitle>
              <CardDescription>{t('dashboard.onboardingSub')} — {num(onboarding.data.completed)}/{num(onboarding.data.total)}</CardDescription>
            </div>
            {can('settings:write') && <Button variant="ghost" size="sm" onClick={() => dismiss.mutate(undefined)}>{t('dashboard.hide')}</Button>}
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-beige-100">
              <div className="h-full bg-gold transition-all" style={{ width: `${(onboarding.data.completed / onboarding.data.total) * 100}%` }} />
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {onboarding.data.steps.map((s: { key: string; done: boolean; href: string }) => (
                <li key={s.key}>
                  <Link href={s.href} className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-white/60">
                    {s.done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-gold" />}
                    <span className={s.done ? 'text-muted-foreground line-through' : ''}>{t(`dashboard.steps.${s.key}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {can('orders:read') && (
        <QueryState q={dash} rows={4}>
          {(d) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Stat label={t('dashboard.todayRevenue')} value={money(d.todayRevenue)} icon={Wallet} />
                <Stat label={t('dashboard.todayOrders')} value={num(d.todayOrders)} icon={ShoppingBag} />
                <Stat label={t('dashboard.pending')} value={num(d.pendingOrders)} icon={PackageOpen} />
                <Stat label={t('dashboard.openReturns')} value={num(d.openReturns)} icon={Undo2} />
                <Stat label={t('dashboard.lowStock')} value={num(d.lowStockVariants)} icon={AlertTriangle} />
                <Stat label={t('dashboard.openConversations')} value={num(d.openConversations)} icon={Inbox} />
              </div>
              <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>{t('dashboard.revenue30')}</CardTitle>
                    <CardDescription className="num">{money(d.last30.kpis.revenue)} · {num(d.last30.kpis.orders)} {t('analytics.orders')}</CardDescription>
                  </CardHeader>
                  <CardContent><SalesChart data={d.last30.series} /></CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
                    <Button asChild variant="link" size="sm"><Link href="/orders">{t('common.view')}</Link></Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {d.recentOrders.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t('orders.empty')}</p> : (
                      <Table>
                        <THead><TR><TH>#</TH><TH>{t('orders.customer')}</TH><TH>{t('common.total')}</TH><TH>{t('common.status')}</TH></TR></THead>
                        <TBody>
                          {d.recentOrders.map((o: any) => (
                            <TR key={o.id}>
                              <TD><Link href={`/orders/${o.id}`} className="num font-medium text-gold-700">#{o.number}</Link><div className="text-xs text-muted-foreground">{date(o.placedAt)}</div></TD>
                              <TD>{o.customer?.fullName ?? '—'}</TD>
                              <TD className="num">{money(o.total)}</TD>
                              <TD><StatusBadge ns="orders.statuses" value={o.status} /></TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </QueryState>
      )}
    </div>
  );
}
