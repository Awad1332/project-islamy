'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { Input } from '@/components/ui/input';

export function VariantPicker({ onPick }: { onPick: (v: any) => void }) {
  const { t, money, locale } = useI18n();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const res = useQuery({ queryKey: ['variant-search', q], queryFn: () => api<any[]>('/variants/search', { query: { q } }), enabled: open });
  return (
    <div className="relative">
      <Search className="absolute start-3 top-3 size-4 text-muted-foreground" />
      <Input className="ps-9" placeholder={t('orders.searchVariant')} value={q} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} onChange={(e) => setQ(e.target.value)} />
      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
          {res.isLoading && <p className="p-3 text-sm text-muted-foreground">{t('common.loading')}</p>}
          {res.data?.length === 0 && <p className="p-3 text-sm text-muted-foreground">{t('inventory.empty')}</p>}
          {res.data?.map((v) => (
            <button key={v.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(v); setQ(''); setOpen(false); }} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm hover:bg-accent">
              <span>
                <span className="font-medium">{locale === 'en' && v.product.titleEn ? v.product.titleEn : v.product.titleAr}</span>
                <span className="block text-xs text-muted-foreground">{v.sku} · {v.size} · {v.color}{v.length ? ` · ${v.length}″` : ''}</span>
              </span>
              <span className="text-end text-xs"><span className="num block font-medium">{money(v.price)}</span><span className={v.stock > 0 ? 'text-emerald-700' : 'text-red-700'}>{t('inventory.onHand')}: {v.stock}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
