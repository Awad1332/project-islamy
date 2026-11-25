'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { slugify } from '@/lib/utils';
import { PageHeader } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

type Cat = { id?: string; nameAr: string; nameEn: string; slug: string; sortOrder: number };

export default function CategoriesPage() {
  const { t, num } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['categories'], queryFn: () => api<any[]>('/categories') });
  const [edit, setEdit] = useState<Cat | null>(null);
  const save = useAction((c: Cat) => (c.id ? api(`/categories/${c.id}`, { method: 'PUT', body: { ...c, nameEn: c.nameEn || null } }) : api('/categories', { body: { ...c, nameEn: c.nameEn || null } })), { invalidate: [['categories']], onSuccess: () => setEdit(null) });
  const del = useAction((id: string) => api(`/categories/${id}`, { method: 'DELETE' }), { invalidate: [['categories']], success: t('common.deleted') });
  const blank: Cat = { nameAr: '', nameEn: '', slug: '', sortOrder: 0 };

  return (
    <>
      <PageHeader title={t('categories.title')} actions={can('catalog:write') && <Button onClick={() => setEdit(blank)}><Plus />{t('categories.new')}</Button>} />
      <QueryState q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={Tags} title={t('categories.empty')} action={can('catalog:write') && <Button variant="gold" onClick={() => setEdit(blank)}><Plus />{t('categories.new')}</Button>} />}>
        {(d) => (
          <Card>
            <Table>
              <THead><TR><TH>{t('categories.nameAr')}</TH><TH>{t('categories.nameEn')}</TH><TH>slug</TH><TH>{t('nav.products')}</TH><TH /></TR></THead>
              <TBody>
                {d.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.nameAr}</TD><TD dir="ltr">{c.nameEn ?? '—'}</TD><TD dir="ltr" className="text-xs">{c.slug}</TD><TD className="num">{num(c._count.products)}</TD>
                    <TD className="text-end">{can('catalog:write') && (<>
                      <Button variant="ghost" size="icon" onClick={() => setEdit({ id: c.id, nameAr: c.nameAr, nameEn: c.nameEn ?? '', slug: c.slug, sortOrder: c.sortOrder })} aria-label="edit"><Pencil /></Button>
                      <Button variant="ghost" size="icon" onClick={() => confirm(t('common.confirmDelete')) && del.mutate(c.id)} aria-label="delete"><Trash2 /></Button>
                    </>)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </QueryState>
      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        {edit && (
          <DialogContent title={edit.id ? t('common.edit') : t('categories.new')}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(edit); }}>
              <Field label={t('categories.nameAr')} error={save.errors.nameAr}><Input value={edit.nameAr} onChange={(e) => setEdit({ ...edit, nameAr: e.target.value })} required /></Field>
              <Field label={t('categories.nameEn')}><Input dir="ltr" value={edit.nameEn} onChange={(e) => setEdit({ ...edit, nameEn: e.target.value, slug: edit.slug || slugify(e.target.value) })} /></Field>
              <Field label="slug" error={save.errors.slug}><Input dir="ltr" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} required /></Field>
              <Button type="submit" loading={save.isPending}>{t('common.save')}</Button>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
