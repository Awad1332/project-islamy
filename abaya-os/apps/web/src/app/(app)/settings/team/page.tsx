'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Trash2, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

export default function TeamPage() {
  const { t, date } = useI18n();
  const { me } = useAuth();
  const q = useQuery({ queryKey: ['team'], queryFn: () => api('/team') });
  const [invite, setInvite] = useState<{ email: string; role: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const send = useAction(() => api('/team/invitations', { body: invite! }), { invalidate: [['team']], success: false, onSuccess: (r: any) => { setInvite(null); setLink(r.inviteUrl); } });
  const role = useAction((p: { id: string; role: string }) => api(`/team/members/${p.id}`, { method: 'PATCH', body: { role: p.role } }), { invalidate: [['team']] });
  const remove = useAction((id: string) => api(`/team/members/${id}`, { method: 'DELETE' }), { invalidate: [['team']], success: t('common.deleted') });
  const revoke = useAction((id: string) => api(`/team/invitations/${id}`, { method: 'DELETE' }), { invalidate: [['team']], success: t('common.deleted') });

  return (
    <>
      <PageHeader title={t('team.title')} actions={<Button onClick={() => setInvite({ email: '', role: q.data?.assignableRoles?.at(-2) ?? 'STAFF' })}><UserPlus />{t('team.invite')}</Button>} />
      <QueryState q={q}>
        {(d: any) => (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{t('team.members')}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead><TR><TH>{t('common.name')}</TH><TH>{t('auth.email')}</TH><TH>{t('team.role')}</TH><TH>{t('team.lastLogin')}</TH><TH /></TR></THead>
                  <TBody>
                    {d.members.map((m: any) => {
                      const locked = m.role === 'OWNER' || m.userId === me?.user.id || !d.assignableRoles.includes(m.role);
                      return (
                        <TR key={m.id} className={!m.isActive ? 'opacity-50' : ''}>
                          <TD className="font-medium">{m.user.fullName}</TD>
                          <TD dir="ltr" className="text-xs">{m.user.email}</TD>
                          <TD>{locked || !m.isActive ? <Badge variant={m.role === 'OWNER' ? 'gold' : 'secondary'}>{t(`team.roles.${m.role}`)}</Badge> : (
                            <Select className="h-8 w-40" value={m.role} onChange={(e) => role.mutate({ id: m.id, role: e.target.value })}>{d.assignableRoles.map((r: string) => <option key={r} value={r}>{t(`team.roles.${r}`)}</option>)}</Select>
                          )}</TD>
                          <TD className="text-xs">{m.user.lastLoginAt ? date(m.user.lastLoginAt, true) : '—'}</TD>
                          <TD>{!locked && m.isActive && <Button variant="ghost" size="icon" onClick={() => confirm(t('common.confirmDelete')) && remove.mutate(m.id)}><Trash2 /></Button>}</TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
            {d.invitations.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{t('team.invitations')}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {d.invitations.map((i: any) => <div key={i.id} className="flex items-center justify-between text-sm"><span dir="ltr">{i.email}</span><span className="flex items-center gap-2"><Badge>{t(`team.roles.${i.role}`)}</Badge><span className="text-xs text-muted-foreground">{date(i.expiresAt)}</span><Button variant="ghost" size="sm" onClick={() => revoke.mutate(i.id)}>{t('team.revoke')}</Button></span></div>)}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </QueryState>
      <Dialog open={Boolean(invite)} onOpenChange={(v) => !v && setInvite(null)}>
        {invite && (
          <DialogContent title={t('team.invite')}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); send.mutate(undefined); }}>
              <Field label={t('auth.email')} error={send.errors.email}><Input type="email" dir="ltr" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></Field>
              <Field label={t('team.role')}><Select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>{(q.data as any)?.assignableRoles.map((r: string) => <option key={r} value={r}>{t(`team.roles.${r}`)}</option>)}</Select></Field>
              <Button type="submit" loading={send.isPending}>{t('team.invite')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={Boolean(link)} onOpenChange={(v) => !v && setLink(null)}>
        {link && (
          <DialogContent title={t('team.inviteLink')} description={t('team.inviteLinkNote')}>
            <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-xs" dir="ltr"><code className="break-all">{link}</code><Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(link); toast.success(t('common.copied')); }}><Copy /></Button></div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
