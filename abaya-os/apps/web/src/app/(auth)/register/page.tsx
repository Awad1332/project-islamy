'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registerSchema } from '@abaya/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { MoreOptions } from '@/components/ui/details';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { errorText, fieldErrors } from '@/lib/errors';
import { slugify } from '@/lib/utils';

export default function RegisterPage() {
  const { t, locale } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ fullName: '', email: '', password: '', storeNameAr: '', storeNameEn: '', slug: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse({ ...f, storeNameEn: f.storeNameEn || undefined, slug: f.slug || undefined, locale });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), t(`errors.${i.message}`, i.message)])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const r = await api<{ accessToken: string }>('/auth/register', { body: parsed.data });
      await login(r.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      setErrors(fieldErrors(err, t));
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <h1 className="font-display text-3xl">{t('auth.register')}</h1>
        <p className="mt-2 text-sm text-gold-700">{t('auth.trial')}</p>
      </div>
      <Field label={t('auth.storeName')} error={errors.storeNameAr}><Input className="h-12 text-base" autoFocus value={f.storeNameAr} onChange={set('storeNameAr')} required /></Field>
      <Field label={t('auth.fullName')} error={errors.fullName}><Input className="h-12 text-base" autoComplete="name" value={f.fullName} onChange={set('fullName')} required /></Field>
      <Field label={t('auth.email')} error={errors.email}><Input className="h-12 text-base" type="email" inputMode="email" autoComplete="email" dir="ltr" value={f.email} onChange={set('email')} required /></Field>
      <Field label={t('auth.password')} error={errors.password} hint={t('auth.passwordHint')}><PasswordInput autoComplete="new-password" value={f.password} onChange={set('password')} required /></Field>
      <MoreOptions label={t('common.moreOptions')}>
        <Field label={t('auth.storeNameEn')}><Input dir="ltr" value={f.storeNameEn} onChange={(e) => setF((s) => ({ ...s, storeNameEn: e.target.value }))} /></Field>
        <Field label={t('auth.slug')} error={errors.slug} hint={t('auth.slugHint')}><Input dir="ltr" value={f.slug} placeholder={slugify(f.storeNameEn) || 'my-store'} onChange={(e) => setF((s) => ({ ...s, slug: slugify(e.target.value) }))} /></Field>
      </MoreOptions>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" size="lg" className="h-12 w-full text-base" loading={busy}>{t('auth.start')}</Button>
      <p className="text-center text-sm text-muted-foreground">{t('auth.haveAccount')} <Link href="/login" className="text-gold-700 hover:underline">{t('auth.login')}</Link></p>
    </form>
  );
}
