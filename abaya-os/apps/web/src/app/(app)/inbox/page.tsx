'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Copy, MessageSquare, Plus, StickyNote, Trash2 } from 'lucide-react';
import { CHANNEL_TYPES, CONVERSATION_STATUSES } from '@abaya/shared';
import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page';
import { EmptyState, LoadingState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status';

export default function InboxPage() {
  const { t, date } = useI18n();
  const { can, me } = useAuth();
  const [status, setStatus] = useState('OPEN');
  const [selected, setSelected] = useState<string | null>(null);
  const [newConv, setNewConv] = useState<any>(null);
  const [channelsDlg, setChannelsDlg] = useState(false);
  const channels = useQuery({ queryKey: ['channels'], queryFn: () => api<any[]>('/inbox/channels') });
  const list = useQuery({ queryKey: ['conversations', status], queryFn: () => api<Paged<any>>('/inbox/conversations', { query: { status, pageSize: 50 } }), refetchInterval: 15000 });
  const create = useAction((b: any) => api('/inbox/conversations', { body: b }), { invalidate: [['conversations']], onSuccess: (c: any) => { setNewConv(null); setSelected(c.id); } });

  return (
    <>
      <PageHeader title={t('inbox.title')} actions={<>
        {can('integrations:manage') && <Button variant="outline" size="sm" onClick={() => setChannelsDlg(true)}>{t('inbox.channels')}</Button>}
        {can('inbox:write') && <Button size="sm" disabled={!channels.data?.length} onClick={() => setNewConv({ channelId: channels.data?.[0]?.id, contactHandle: '', subject: '' })}><Plus />{t('inbox.newConversation')}</Button>}
      </>} />
      <div className="grid h-[calc(100vh-14rem)] min-h-[480px] gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="flex flex-col overflow-hidden">
          <div className="flex gap-1 border-b p-2">
            {CONVERSATION_STATUSES.map((s) => <Button key={s} size="sm" variant={status === s ? 'secondary' : 'ghost'} onClick={() => setStatus(s)}>{t(`inbox.statuses.${s}`)}</Button>)}
          </div>
          <div className="flex-1 overflow-y-auto">
            <QueryState q={list} isEmpty={(d) => d.items.length === 0} empty={<div className="p-4"><EmptyState icon={MessageSquare} title={t('inbox.empty')} /></div>}>
              {(d) => d.items.map((c) => (
                <button key={c.id} onClick={() => setSelected(c.id)} className={cn('block w-full border-b p-3 text-start hover:bg-muted/50', selected === c.id && 'bg-gold-100/50')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{c.customerName ?? c.subject ?? c.contactHandle}</span>
                    {c.unreadCount > 0 && <Badge variant="gold">{c.unreadCount}</Badge>}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{t(`inbox.channelTypes.${c.channel.type}`)}</span><span>{date(c.lastMessageAt, true)}</span></div>
                  {c.lastMessage && <p className="mt-1 truncate text-xs">{c.lastMessage.body}</p>}
                </button>
              ))}
            </QueryState>
          </div>
        </Card>
        <Card className="flex flex-col overflow-hidden">
          {selected ? <Conversation id={selected} meId={me?.user.id} /> : <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">{t('inbox.select')}</div>}
        </Card>
      </div>
      <Dialog open={Boolean(newConv)} onOpenChange={(v) => !v && setNewConv(null)}>
        {newConv && (
          <DialogContent title={t('inbox.newConversation')}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate({ channelId: newConv.channelId, contactHandle: newConv.contactHandle, subject: newConv.subject || null }); }}>
              <Field label={t('inbox.channels')}><Select value={newConv.channelId} onChange={(e) => setNewConv({ ...newConv, channelId: e.target.value })}>{channels.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
              <Field label={t('inbox.contact')}><Input dir="ltr" required value={newConv.contactHandle} onChange={(e) => setNewConv({ ...newConv, contactHandle: e.target.value })} placeholder="+9665XXXXXXXX" /></Field>
              <Field label={t('marketing.subject')}><Input value={newConv.subject} onChange={(e) => setNewConv({ ...newConv, subject: e.target.value })} /></Field>
              <Button type="submit" loading={create.isPending}>{t('common.create')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
      {channelsDlg && <ChannelsDialog onClose={() => setChannelsDlg(false)} tenantId={me!.tenant.id} />}
    </>
  );
}

function Conversation({ id, meId }: { id: string; meId?: string }) {
  const { t, date } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['conversation', id], queryFn: () => api(`/inbox/conversations/${id}`), refetchInterval: 10000 });
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<'REPLY' | 'NOTE'>('REPLY');
  const end = useRef<HTMLDivElement>(null);
  const send = useAction(() => api(`/inbox/conversations/${id}/messages`, { body: { body, kind } }), { invalidate: [['conversation', id], ['conversations']], success: false, onSuccess: (m: any) => { setBody(''); if (m.status === 'NOT_SENT' || m.status === 'FAILED') toast.warning(t(`inbox.messageStatuses.${m.status}`)); } });
  const update = useAction((b: any) => api(`/inbox/conversations/${id}`, { method: 'PATCH', body: b }), { invalidate: [['conversation', id], ['conversations']] });
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [q.data?.messages.length]);
  if (q.isLoading) return <div className="p-6"><LoadingState /></div>;
  if (!q.data) return null;
  const c = q.data;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <div>
          <div className="font-medium">{c.customer?.fullName ?? c.subject ?? c.contactHandle}</div>
          <div className="text-xs text-muted-foreground" dir="ltr">{c.contactHandle} · {t(`inbox.channelTypes.${c.channel.type}`)}</div>
        </div>
        {can('inbox:write') && (
          <div className="flex gap-2">
            {c.assigneeId !== meId && <Button size="sm" variant="outline" onClick={() => update.mutate({ assigneeId: meId })}>{t('inbox.assign')}</Button>}
            <Button size="sm" variant="outline" onClick={() => update.mutate({ status: c.status === 'CLOSED' ? 'OPEN' : 'CLOSED' })}>{c.status === 'CLOSED' ? t('inbox.reopen') : t('inbox.close')}</Button>
          </div>
        )}
      </div>
      {!c.deliveryConnected && <p className="flex items-center gap-2 bg-amber-50 px-3 py-2 text-xs text-amber-900"><AlertTriangle className="size-4" />{t('inbox.deliveryOff')}</p>}
      <div className="flex-1 space-y-3 overflow-y-auto bg-ivory-50 p-4">
        {c.messages.map((m: any) => (
          <div key={m.id} className={cn('flex', m.direction === 'INBOUND' ? 'justify-start' : 'justify-end')}>
            <div className={cn('max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm', m.direction === 'INBOUND' && 'bg-card', m.direction === 'OUTBOUND' && 'bg-charcoal text-ivory', m.direction === 'NOTE' && 'border border-dashed border-gold-300 bg-gold-100')}>
              {m.direction === 'NOTE' && <StickyNote className="mb-1 size-3 text-gold-700" />}
              <p className="whitespace-pre-wrap">{m.body}</p>
              <div className="mt-1 flex items-center justify-end gap-2 text-[10px] opacity-70">{date(m.createdAt, true)}{m.direction === 'OUTBOUND' && <StatusBadge ns="inbox.messageStatuses" value={m.status} />}</div>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {can('inbox:write') && (
        <form className="space-y-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); if (body.trim()) send.mutate(undefined); }}>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant={kind === 'REPLY' ? 'secondary' : 'ghost'} onClick={() => setKind('REPLY')}>{t('inbox.reply')}</Button>
            <Button type="button" size="sm" variant={kind === 'NOTE' ? 'secondary' : 'ghost'} onClick={() => setKind('NOTE')}>{t('inbox.note')}</Button>
          </div>
          <div className="flex gap-2">
            <Textarea rows={2} className="min-h-0" placeholder={t('inbox.placeholder')} value={body} onChange={(e) => setBody(e.target.value)} />
            <Button type="submit" loading={send.isPending}>{t('common.send')}</Button>
          </div>
        </form>
      )}
    </>
  );
}

function ChannelsDialog({ onClose, tenantId }: { onClose: () => void; tenantId: string }) {
  const { t } = useI18n();
  const q = useQuery({ queryKey: ['channels'], queryFn: () => api<any[]>('/inbox/channels') });
  const [f, setF] = useState({ type: 'WHATSAPP', name: '' });
  const create = useAction(() => api('/inbox/channels', { body: { ...f, externalId: null, integrationId: null } }), { invalidate: [['channels']], onSuccess: () => setF({ ...f, name: '' }) });
  const del = useAction((id: string) => api(`/inbox/channels/${id}`, { method: 'DELETE' }), { invalidate: [['channels']], success: t('common.deleted') });
  const webhook = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp/${tenantId}` : '';
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent wide title={t('inbox.channels')}>
        <div className="space-y-4">
          {q.data?.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{c.name} · {t(`inbox.channelTypes.${c.type}`)}</span>
              <span className="flex items-center gap-2">{c.deliveryConnected ? <Badge variant="success">{t('common.connected')}</Badge> : <Badge variant="warning">{t('common.notConnected')}</Badge>}<Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}><Trash2 /></Button></span>
            </div>
          ))}
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate(undefined); }}>
            <Field label={t('marketing.channel')}><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{CHANNEL_TYPES.map((c) => <option key={c} value={c}>{t(`inbox.channelTypes.${c}`)}</option>)}</Select></Field>
            <Field label={t('common.name')}><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Button type="submit" loading={create.isPending}><Plus />{t('common.add')}</Button>
          </form>
          <div className="rounded-md bg-muted p-3 text-xs">
            <div className="mb-1 font-medium">{t('inbox.webhook')}</div>
            <div className="flex items-center gap-2" dir="ltr"><code className="break-all">{webhook}</code><Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(webhook); toast.success(t('common.copied')); }}><Copy /></Button></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
