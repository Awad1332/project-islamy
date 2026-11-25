'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function CustomerDialog({ open, onOpenChange, customer, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; customer?: any; onSaved?: (c: any) => void }) {
  const { t } = useI18n();
  const [f, setF] = useState(() => ({
    fullName: customer?.fullName ?? '', phone: customer?.phone ?? '', email: customer?.email ?? '', city: customer?.city ?? '', district: customer?.district ?? '',
    addressLine: customer?.addressLine ?? '', birthday: customer?.birthday?.slice(0, 10) ?? '', tags: (customer?.tags ?? []).join(', '), acceptsMarketing: customer?.acceptsMarketing ?? false, notes: customer?.notes ?? '',
  }));
  const save = useAction(() => {
    const body = { ...f, phone: f.phone || null, email: f.email || null, city: f.city || null, district: f.district || null, addressLine: f.addressLine || null, birthday: f.birthday || null, notes: f.notes || null, tags: f.tags.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean) };
    return customer ? api(`/customers/${customer.id}`, { method: 'PUT', body }) : api('/customers', { body });
  }, { invalidate: [['customers'], ['customer', customer?.id]], onSuccess: (c) => { onOpenChange(false); onSaved?.(c); } });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide title={customer ? t('common.edit') : t('customers.new')}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(undefined); }}>
          <Field label={t('customers.fullName')} error={save.errors.fullName}><Input required value={f.fullName} onChange={set('fullName')} /></Field>
          <Field label={t('customers.phone')} error={save.errors.phone}><Input dir="ltr" placeholder="05XXXXXXXX" value={f.phone} onChange={set('phone')} /></Field>
          <Field label={t('customers.email')} error={save.errors.email}><Input dir="ltr" type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label={t('customers.birthday')}><Input type="date" value={f.birthday} onChange={set('birthday')} /></Field>
          <Field label={t('customers.city')}><Input value={f.city} onChange={set('city')} /></Field>
          <Field label={t('customers.district')}><Input value={f.district} onChange={set('district')} /></Field>
          <Field label={t('customers.address')} className="sm:col-span-2"><Input value={f.addressLine} onChange={set('addressLine')} /></Field>
          <Field label={t('customers.tags')} hint={t('products.tagsHint')}><Input value={f.tags} onChange={set('tags')} /></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><Switch checked={f.acceptsMarketing} onCheckedChange={(v) => setF((s) => ({ ...s, acceptsMarketing: v }))} />{t('customers.acceptsMarketing')}</label>
          <Field label={t('common.notes')} className="sm:col-span-2"><Textarea rows={2} value={f.notes} onChange={set('notes')} /></Field>
          <div className="sm:col-span-2"><Button type="submit" loading={save.isPending}>{t('common.save')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
