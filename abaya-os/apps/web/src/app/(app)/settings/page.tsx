'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantSettingsSchema } from '@abaya/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { sarInput, toHalalas } from '@/lib/utils';
import { PageHeader } from '@/components/page';
import { QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { t } = useI18n();
  const { can } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api('/settings') });
  const [f, setF] = useState<any>(null);
  const [local, setLocal] = useState<Record<string, string>>({});
  useEffect(() => {
    if (q.data) setF({
      nameAr: q.data.nameAr, nameEn: q.data.nameEn ?? '', contactEmail: q.data.contactEmail ?? '', contactPhone: q.data.contactPhone ?? '', vatEnabled: q.data.vatEnabled,
      vatRate: String(q.data.vatRateBps / 100), pricesIncludeVat: q.data.pricesIncludeVat, vatNumber: q.data.vatNumber ?? '', commercialRegistration: q.data.commercialRegistration ?? '',
      defaultLocale: q.data.defaultLocale, addressCity: q.data.addressCity ?? '', addressLine: q.data.addressLine ?? '', lowStockThreshold: String(q.data.lowStockThreshold),
      defaultShippingFee: sarInput(q.data.defaultShippingFee), freeShippingThreshold: sarInput(q.data.freeShippingThreshold),
    });
  }, [q.data]);
  const save = useAction((body: any) => api('/settings', { method: 'PUT', body }), { invalidate: [['settings'], ['onboarding']], onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }) });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const changePw = useAction(() => api('/auth/change-password', { body: pw }), { onSuccess: () => setPw({ currentPassword: '', newPassword: '' }) });
  const editable = can('settings:write');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      nameAr: f.nameAr, nameEn: f.nameEn || null, contactEmail: f.contactEmail || null, contactPhone: f.contactPhone || null, vatEnabled: f.vatEnabled,
      vatRateBps: Math.round(Number(f.vatRate) * 100), pricesIncludeVat: f.pricesIncludeVat, vatNumber: f.vatNumber || null, commercialRegistration: f.commercialRegistration || null,
      defaultLocale: f.defaultLocale, addressCity: f.addressCity || null, addressLine: f.addressLine || null, lowStockThreshold: Number(f.lowStockThreshold),
      defaultShippingFee: toHalalas(f.defaultShippingFee || 0), freeShippingThreshold: f.freeShippingThreshold ? toHalalas(f.freeShippingThreshold) : null,
    };
    const parsed = tenantSettingsSchema.safeParse(body);
    if (!parsed.success) {
      setLocal(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), t(`errors.${i.message}`, i.message)])));
      return;
    }
    setLocal({});
    save.mutate(body);
  }
  const err = (k: string) => local[k] ?? save.errors[k];

  return (
    <>
      <PageHeader title={t('settings.title')} description={t('settings.currencyTz')} />
      <QueryState q={q}>
        {() => f && (
          <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t('settings.store')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label={t('settings.nameAr')} error={err('nameAr')}><Input disabled={!editable} value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} /></Field>
                <Field label={t('settings.nameEn')}><Input dir="ltr" disabled={!editable} value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('settings.contactEmail')} error={err('contactEmail')}><Input dir="ltr" disabled={!editable} value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
                  <Field label={t('settings.contactPhone')} error={err('contactPhone')}><Input dir="ltr" placeholder="05XXXXXXXX" disabled={!editable} value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} /></Field>
                  <Field label={t('settings.city')}><Input disabled={!editable} value={f.addressCity} onChange={(e) => setF({ ...f, addressCity: e.target.value })} /></Field>
                  <Field label={t('settings.locale')}><Select disabled={!editable} value={f.defaultLocale} onChange={(e) => setF({ ...f, defaultLocale: e.target.value })}><option value="ar">العربية</option><option value="en">English</option></Select></Field>
                </div>
                <Field label={t('settings.address')}><Input disabled={!editable} value={f.addressLine} onChange={(e) => setF({ ...f, addressLine: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={t('settings.lowStock')}><Input type="number" min={0} disabled={!editable} value={f.lowStockThreshold} onChange={(e) => setF({ ...f, lowStockThreshold: e.target.value })} /></Field>
                  <Field label={t('settings.shippingFee')}><Input type="number" step="0.01" min={0} disabled={!editable} value={f.defaultShippingFee} onChange={(e) => setF({ ...f, defaultShippingFee: e.target.value })} /></Field>
                  <Field label={t('settings.freeShipping')}><Input type="number" step="0.01" min={0} disabled={!editable} value={f.freeShippingThreshold} onChange={(e) => setF({ ...f, freeShippingThreshold: e.target.value })} /></Field>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>{t('settings.vat')}</CardTitle><CardDescription>ZATCA</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-3 text-sm"><Switch disabled={!editable} checked={f.vatEnabled} onCheckedChange={(v) => setF({ ...f, vatEnabled: v })} />{t('settings.vatEnabled')}</label>
                  <label className="flex items-center gap-3 text-sm"><Switch disabled={!editable} checked={f.pricesIncludeVat} onCheckedChange={(v) => setF({ ...f, pricesIncludeVat: v })} />{t('settings.pricesIncludeVat')}</label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label={t('settings.vatRate')} error={err('vatRateBps')}><Input type="number" step="0.01" min={0} max={100} disabled={!editable || !f.vatEnabled} value={f.vatRate} onChange={(e) => setF({ ...f, vatRate: e.target.value })} /></Field>
                    <Field label={t('settings.vatNumber')} error={err('vatNumber')} className="sm:col-span-2"><Input dir="ltr" maxLength={15} placeholder="3XXXXXXXXXXXXX3" disabled={!editable} value={f.vatNumber} onChange={(e) => setF({ ...f, vatNumber: e.target.value })} /></Field>
                  </div>
                  <Field label={t('settings.cr')} error={err('commercialRegistration')}><Input dir="ltr" maxLength={10} disabled={!editable} value={f.commercialRegistration} onChange={(e) => setF({ ...f, commercialRegistration: e.target.value })} /></Field>
                </CardContent>
              </Card>
              {editable && <Button type="submit" className="w-full" loading={save.isPending}>{t('common.save')}</Button>}
              <Card>
                <CardHeader><CardTitle>{t('settings.password')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Field label={t('settings.currentPassword')}><Input type="password" dir="ltr" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
                  <Field label={t('settings.newPassword')} hint={t('auth.passwordHint')} error={changePw.errors.newPassword}><Input type="password" dir="ltr" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
                  <Button type="button" variant="outline" disabled={!pw.currentPassword || !pw.newPassword} loading={changePw.isPending} onClick={() => changePw.mutate(undefined)}>{t('common.save')}</Button>
                </CardContent>
              </Card>
            </div>
          </form>
        )}
      </QueryState>
    </>
  );
}
