'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { errorText } from '@/lib/errors';

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ accessToken: string }>('/auth/login', { body: { email, password } });
      await login(r.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">{t('auth.welcome')}</h1>
        <div className="gold-rule mt-3" />
      </div>
      <Field label={t('auth.email')}><Input type="email" autoComplete="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label={t('auth.password')}><Input type="password" autoComplete="current-password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" className="w-full" loading={busy}>{t('auth.login')}</Button>
      <p className="text-center text-sm text-muted-foreground">{t('auth.noAccount')} <Link href="/register" className="text-gold-700 hover:underline">{t('auth.register')}</Link></p>
    </form>
  );
}
