'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader, Pagination, Stat } from '@/components/page';
import { ErrorState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';
import { ApiError } from '@/lib/api';

export default function AdminPage() {
  const { t, money, num, date } = useI18n();
  const { me } = useAuth();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [assign, setAssign] = useState<any>(null);
  const metrics = useQuery({ queryKey: ['admin-metrics'], queryFn: () => api('/admin/metrics'), enabled: Boolean(me?.user.isPlatformAdmin) });
  const tenants = useQuery({ queryKey: ['admin-tenants', q, page], queryFn: () => api<Paged<any>>('/admin/tenants', { query: { q, page } }), enabled: Boolean(me?.user.isPlatformAdmin) });
  const plans = useQuery({ queryKey: ['admin-plans'], queryFn: () => api<any[]>('/admin/plans'), enabled: Boolean(me?.user.isPlatformAdmin) });
  const setStatus = useAction((p: { id: string; status: string }) => api(`/admin/tenants/${p.id}/status`, { method: 'PATCH', body: { status: p.status } }), { invalidate: [['admin-tenants'], ['admin-metrics']] });
  const doAssign = useAction(() => api(`/admin/tenants/${assign.id}/assign-plan`, { body: { planCode: assign.planCode, interval: assign.interval, markPaid: assign.markPaid, paymentReference: assign.ref || undefined } }), { invalidate: [['admin-tenants'], ['admin-metrics']], onSuccess: () => setAssign(null) });

  if (!me?.user.isPlatformAdmin) return <ErrorState error={new ApiError(403, 'PLATFORM_ADMIN_REQUIRED', '')} />;
  return (
    <>
      <PageHeader title={t('admin.title')} />
      <QueryState q={metrics} rows={2}>
        {(m) => (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label={t('admin.tenants')} value={num(m.tenants)} hint={`${num(m.activeTenants)} ${t('common.active')} · ${num(m.suspendedTenants)} ✕`} />
            <Stat label={t('admin.users')} value={num(m.users)} />
            <Stat label={t('analytics.orders')} value={num(m.orders)} />
            <Stat label={t('admin.gmv')} value={money(m.gmv)} />
            <Stat label={t('admin.mrr')} value={money(m.mrr)} />
          </div>
        )}
      </QueryState>
      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between"><CardTitle>{t('admin.tenants')}</CardTitle><Input className="max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></CardHeader>
        <CardContent className="p-0">
          <QueryState q={tenants}>
            {(d) => (
              <>
                <Table>
                  <THead><TR><TH>{t('common.name')}</TH><TH>slug</TH><TH>{t('billing.plan')}</TH><TH>{t('team.members')}</TH><TH>{t('common.date')}</TH><TH>{t('common.status')}</TH><TH /></TR></THead>
                  <TBody>
                    {d.items.map((x) => (
                      <TR key={x.id}>
                        <TD className="font-medium">{x.nameAr} {x.isDemo && <Badge variant="gold">demo</Badge>}</TD>
                        <TD dir="ltr" className="text-xs">{x.slug}</TD>
                        <TD>{x.subscription ? <>{x.subscription.plan.nameAr} <StatusBadge ns="billing.statuses" value={x.subscription.status} /></> : '—'}</TD>
                        <TD className="num">{num(x._count.memberships)}</TD>
                        <TD className="text-xs">{date(x.createdAt)}</TD>
                        <TD><Badge variant={x.status === 'ACTIVE' ? 'success' : 'danger'}>{x.status}</Badge></TD>
                        <TD className="whitespace-nowrap text-end">
                          <Button size="sm" variant="ghost" onClick={() => setAssign({ id: x.id, name: x.nameAr, planCode: plans.data?.[0]?.code ?? '', interval: 'MONTHLY', markPaid: false, ref: '' })}>{t('admin.assignPlan')}</Button>
                          {x.slug !== 'abaya-os-hq' && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: x.id, status: x.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}>{x.status === 'ACTIVE' ? t('admin.suspend') : t('admin.activate')}</Button>}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <div className="p-4"><Pagination page={d.page} pageCount={d.pageCount} total={d.total} onPage={setPage} /></div>
              </>
            )}
          </QueryState>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('admin.plans')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <QueryState q={plans}>
            {(ps) => <Table><THead><TR><TH>code</TH><TH>{t('common.name')}</TH><TH>{t('billing.monthly')}</TH><TH>{t('billing.yearly')}</TH><TH>{t('billing.products')}</TH><TH>{t('billing.staff')}</TH><TH>AI</TH><TH /></TR></THead>
              <TBody>{ps.map((p) => <TR key={p.id}><TD dir="ltr">{p.code}</TD><TD>{p.nameAr} / {p.nameEn}</TD><TD className="num">{money(p.priceMonthly)}</TD><TD className="num">{money(p.priceYearly)}</TD><TD className="num">{num(p.maxProducts)}</TD><TD className="num">{num(p.maxStaff)}</TD><TD className="num">{num(p.aiCreditsMonthly)}</TD><TD className="num text-xs">{num(p._count.subscriptions)}</TD></TR>)}</TBody></Table>}
          </QueryState>
        </CardContent>
      </Card>
      <Dialog open={Boolean(assign)} onOpenChange={(v) => !v && setAssign(null)}>
        {assign && (
          <DialogContent title={`${t('admin.assignPlan')} — ${assign.name}`}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); doAssign.mutate(undefined); }}>
              <Field label={t('billing.plan')}><Select value={assign.planCode} onChange={(e) => setAssign({ ...assign, planCode: e.target.value })}>{plans.data?.map((p) => <option key={p.id} value={p.code}>{p.nameAr}</option>)}</Select></Field>
              <Field label="Interval"><Select value={assign.interval} onChange={(e) => setAssign({ ...assign, interval: e.target.value })}><option value="MONTHLY">{t('billing.monthly')}</option><option value="YEARLY">{t('billing.yearly')}</option></Select></Field>
              <label className="flex items-center gap-2 text-sm"><Switch checked={assign.markPaid} onCheckedChange={(v) => setAssign({ ...assign, markPaid: v })} />{t('admin.markPaid')}</label>
              <Field label={t('admin.paymentRef')}><Input dir="ltr" value={assign.ref} onChange={(e) => setAssign({ ...assign, ref: e.target.value })} /></Field>
              <Button type="submit" loading={doAssign.isPending}>{t('common.save')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
