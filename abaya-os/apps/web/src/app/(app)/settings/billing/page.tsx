'use client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';

export default function BillingPage() {
  const { t, money, date, num, locale } = useI18n();
  const q = useQuery({ queryKey: ['billing'], queryFn: () => api('/billing') });
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api<any[]>('/billing/plans') });
  const change = useAction((code: string) => api('/billing/change-plan', { body: { planCode: code, interval: 'MONTHLY' } }), { invalidate: [['billing']] });
  const cancel = useAction((c: boolean) => api('/billing/cancel', { body: { cancel: c } }), { invalidate: [['billing']] });
  return (
    <>
      <PageHeader title={t('billing.title')} />
      <QueryState q={q}>
        {(d: any) => (
          <div className="space-y-6">
            {!d.gateway.configured && <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{t('billing.gatewayOff')}</p>}
            {d.subscription && (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle>{t('billing.plan')}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="font-display text-2xl">{locale === 'en' ? d.subscription.plan.nameEn : d.subscription.plan.nameAr}</div>
                    <StatusBadge ns="billing.statuses" value={d.subscription.status} />
                    {d.subscription.trialEndsAt && <p>{t('billing.trialEnds')}: {date(d.subscription.trialEndsAt)}</p>}
                    <p>{t('billing.periodEnds')}: {date(d.subscription.currentPeriodEnd)}</p>
                    {d.subscription.cancelAtPeriodEnd && <p className="text-amber-800">{t('billing.cancelNote')}</p>}
                    <Button variant="outline" size="sm" onClick={() => cancel.mutate(!d.subscription.cancelAtPeriodEnd)}>{d.subscription.cancelAtPeriodEnd ? t('billing.resume') : t('billing.cancel')}</Button>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>{t('billing.usage')}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {(['products', 'staff', 'aiCredits'] as const).map((k) => {
                      const u = d.usage[k];
                      return (
                        <div key={k}>
                          <div className="flex justify-between text-sm"><span>{t(`billing.${k}`)}</span><span className="num">{num(u.used)} / {num(u.limit)}</span></div>
                          <div className="mt-1 h-2 rounded-full bg-beige-100"><div className={`h-full rounded-full ${u.used / u.limit > 0.9 ? 'bg-red-500' : 'bg-gold'}`} style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }} /></div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
            <QueryState q={plans}>
              {(ps) => (
                <div className="grid gap-4 md:grid-cols-3">
                  {ps.map((p) => {
                    const current = d.subscription?.planId === p.id;
                    return (
                      <Card key={p.id} className={current ? 'border-gold' : ''}>
                        <CardHeader><CardTitle className="font-display text-xl">{locale === 'en' ? p.nameEn : p.nameAr}</CardTitle><div className="num text-2xl font-semibold">{money(p.priceMonthly)} <span className="text-xs font-normal text-muted-foreground">/ {t('billing.monthly')}</span></div><div className="text-xs text-muted-foreground num">{money(p.priceYearly)} / {t('billing.yearly')}</div></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p className="flex gap-2"><Check className="size-4 text-gold" />{num(p.maxProducts)} {t('billing.products')}</p>
                          <p className="flex gap-2"><Check className="size-4 text-gold" />{num(p.maxStaff)} {t('billing.staff')}</p>
                          <p className="flex gap-2"><Check className="size-4 text-gold" />{num(p.aiCreditsMonthly)} {t('billing.aiCredits')}</p>
                          <Button className="mt-2 w-full" variant={current ? 'secondary' : 'outline'} disabled={current} loading={change.isPending && change.variables === p.code} onClick={() => change.mutate(p.code)}>{current ? '✓' : t('billing.choose')}</Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </QueryState>
            {d.invoices.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{t('billing.invoices')}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <THead><TR><TH>#</TH><TH>{t('common.date')}</TH><TH>{t('orders.vat')}</TH><TH>{t('common.total')}</TH><TH>{t('common.status')}</TH></TR></THead>
                    <TBody>{d.invoices.map((i: any) => <TR key={i.id}><TD className="num">{i.number}</TD><TD>{date(i.createdAt)}</TD><TD className="num">{money(i.vatAmount)}</TD><TD className="num">{money(i.total)}</TD><TD>{i.status}</TD></TR>)}</TBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </QueryState>
    </>
  );
}
