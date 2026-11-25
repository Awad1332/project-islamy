'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Circle, MessageCircle, PackageCheck, RefreshCcw, ShoppingBag, UserPlus, Ruler, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useUiMode } from '@/lib/mode';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { Stat } from '@/components/page';
import { QueryState } from '@/components/states';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status';
import { SalesChart } from '@/components/charts/sales-chart';
import { AbayaIcon } from '@/components/icons';

export default function Dashboard() {
  const { t, money, num, date, locale } = useI18n();
  const { me, can } = useAuth();
  const { pro } = useUiMode();
  const dash = useQuery({ queryKey: ['dashboard'], queryFn: () => api('/analytics/dashboard'), enabled: can('orders:read') });
  const onboarding = useQuery({ queryKey: ['onboarding'], queryFn: () => api('/onboarding') });
  const dismiss = useAction(() => api('/onboarding/dismiss', { body: { dismissed: true } }), { invalidate: [['onboarding']], success: false });
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Riyadh' }).format(new Date()));
  const firstName = me?.user.fullName.split(' ')[0];
  const Arrow = locale === 'ar' ? ChevronLeft : ChevronRight;

  const actions = [
    can('catalog:write') && { href: '/products/new', icon: AbayaIcon, title: t('home.addAbaya'), sub: t('home.addAbayaSub') },
    can('orders:write') && { href: '/orders/new', icon: ShoppingBag, title: t('home.newOrder'), sub: t('home.newOrderSub') },
    can('customers:write') && { href: '/customers?new=1', icon: UserPlus, title: t('home.addCustomer'), sub: t('home.addCustomerSub') },
    can('catalog:read') && { href: '/sizing', icon: Ruler, title: t('home.suggestSize'), sub: t('home.suggestSizeSub') },
  ].filter(Boolean) as { href: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; sub: string }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{hour < 12 ? t('home.morning') : t('home.evening')}{firstName ? `، ${firstName}` : ''}</h1>
        <p className="mt-2 text-muted-foreground">{t('home.quick')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-gold">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gold-100 text-gold-700 transition group-hover:bg-gold group-hover:text-white"><a.icon className="size-6" strokeWidth={1.75} /></span>
            <span><span className="block text-base font-semibold">{a.title}</span><span className="text-xs text-muted-foreground">{a.sub}</span></span>
          </Link>
        ))}
      </div>

      {can('orders:read') && (
        <QueryState q={dash} rows={3}>
          {(d) => {
            const attention = [
              d.pendingOrders > 0 && { n: d.pendingOrders, text: t('home.pendingOrders'), href: '/orders', icon: PackageCheck },
              d.openReturns > 0 && { n: d.openReturns, text: t('home.openReturns'), href: '/returns', icon: RefreshCcw },
              d.lowStockVariants > 0 && { n: d.lowStockVariants, text: t('home.lowStock'), href: pro ? '/inventory' : '/products', icon: AlertTriangle },
              d.openConversations > 0 && { n: d.openConversations, text: t('home.openConversations'), href: '/inbox', icon: MessageCircle },
            ].filter(Boolean) as { n: number; text: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
            return (
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-2">
                  <Card>
                    <CardHeader><CardTitle>{t('home.attention')}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {attention.length === 0 ? (
                        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="size-5" />{t('home.allGood')}</p>
                      ) : attention.map((a) => (
                        <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl border p-3 transition hover:border-gold">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800"><a.icon className="size-5" /></span>
                          <span className="flex flex-1 items-baseline gap-1.5 text-sm"><b className="num text-base">{num(a.n)}</b><span>{a.text}</span></span>
                          <Arrow className="size-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label={t('home.salesToday')} value={money(d.todayRevenue)} icon={Wallet} />
                    <Stat label={t('home.ordersToday')} value={num(d.todayOrders)} icon={ShoppingBag} />
                  </div>
                </div>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>{t('home.last30')}</CardTitle>
                    <CardDescription className="num">{money(d.last30.kpis.revenue)} · {num(d.last30.kpis.orders)} {t('analytics.orders')}</CardDescription>
                  </CardHeader>
                  <CardContent><SalesChart data={d.last30.series} /></CardContent>
                </Card>
                {pro && (
                  <Card className="lg:col-span-5">
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
                      <Button asChild variant="link" size="sm"><Link href="/orders">{t('common.view')}</Link></Button>
                    </CardHeader>
                    <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {d.recentOrders.map((o: any) => (
                        <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between rounded-xl border p-3 hover:border-gold">
                          <span><span className="num font-medium">#{o.number}</span> <span className="text-sm">{o.customer?.fullName ?? ''}</span><span className="block text-xs text-muted-foreground">{date(o.placedAt)}</span></span>
                          <span className="text-end"><span className="num block text-sm font-medium">{money(o.total)}</span><StatusBadge ns="orders.statuses" value={o.status} /></span>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          }}
        </QueryState>
      )}

      {onboarding.data && !onboarding.data.dismissed && onboarding.data.completed < onboarding.data.total && (
        <Card className="border-gold-300">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="font-display text-lg">{t('dashboard.onboarding')}</CardTitle>
              <CardDescription>{t('dashboard.onboardingSub')} — {num(onboarding.data.completed)}/{num(onboarding.data.total)}</CardDescription>
            </div>
            {can('settings:write') && <Button variant="ghost" size="sm" onClick={() => dismiss.mutate(undefined)}>{t('dashboard.hide')}</Button>}
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-beige-100"><div className="h-full bg-gold" style={{ width: `${(onboarding.data.completed / onboarding.data.total) * 100}%` }} /></div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {onboarding.data.steps.map((s: { key: string; done: boolean; href: string }) => (
                <li key={s.key}>
                  <Link href={s.href} className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-muted">
                    {s.done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-gold" />}
                    <span className={s.done ? 'text-muted-foreground line-through' : ''}>{t(`dashboard.steps.${s.key}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
