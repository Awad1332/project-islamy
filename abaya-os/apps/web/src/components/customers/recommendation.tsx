'use client';
import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/badge';

export function RecommendationResult({ r }: { r: any }) {
  const { t } = useI18n();
  return (
    <div className="space-y-3 rounded-lg border border-gold-300 bg-gold-100/40 p-4">
      <div className="flex flex-wrap items-end gap-6">
        <div><div className="text-xs text-muted-foreground">{t('sizing.size')}</div><div className="font-display text-3xl">{r.size ?? '—'}</div></div>
        <div><div className="text-xs text-muted-foreground">{t('sizing.length')}</div><div className="font-display text-3xl num">{r.length ? `${r.length}″` : '—'}</div></div>
        <div><div className="text-xs text-muted-foreground">{t('sizing.confidence')}</div><div className="text-xl font-semibold num">{Math.round(r.confidence * 100)}%</div></div>
        {r.alternative && <div><div className="text-xs text-muted-foreground">{t('sizing.alternative')}</div><div className="text-xl">{r.alternative}</div></div>}
      </div>
      {r.reasons?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.reasons.map((x: any) => (
            <Badge key={x.key} variant={x.status === 'within' ? 'success' : 'warning'}>
              {t(`customers.${x.key}`).replace(/\s*\(.*\)/, '')}: <span className="num">{x.value}</span> ({t(`sizing.${x.status}`)} <span className="num">{x.range.min}–{x.range.max}</span>)
            </Badge>
          ))}
        </div>
      )}
      {r.notes?.length > 0 && <ul className="list-disc ps-5 text-xs text-muted-foreground">{r.notes.map((n: string) => <li key={n}>{t(`sizing.notes.${n}`, n)}</li>)}</ul>}
    </div>
  );
}
