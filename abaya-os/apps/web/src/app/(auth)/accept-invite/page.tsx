'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { errorText } from '@/lib/errors';

function AcceptInvite() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ accessToken: string }>('/auth/accept-invite', { body: { token, fullName, password } });
      await login(r.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-display text-3xl">{t('auth.acceptInvite')}</h1>
      <p className="text-sm text-muted-foreground">{t('auth.inviteSub')}</p>
      <Field label={t('auth.fullName')}><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
      <Field label={t('auth.password')} hint={t('auth.passwordHint')}><Input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" className="w-full" loading={busy} disabled={!token}>{t('auth.acceptInvite')}</Button>
    </form>
  );
}
export default function Page() {
  return <Suspense><AcceptInvite /></Suspense>;
}
