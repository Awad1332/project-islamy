import { Card, fmtN, fmtPct } from "@/components/dashboard/charts";
import { ConvertButton } from "@/components/dashboard/ConvertButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { parseDays, WindowTabs } from "@/components/dashboard/WindowTabs";
import { Icon } from "@/components/ui";
import { GROUP_META } from "@/lib/engine/types";
import { currentMerchant } from "@/lib/services/auth";
import { trendLab } from "@/lib/services/analytics";
import { loadCatalog } from "@/lib/services/catalog";
import { cx } from "@/lib/cx";

export default async function TrendLab({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = parseDays((await searchParams).days);
  const m = (await currentMerchant())!;
  const t = await trendLab(await loadCatalog(m.storeId), days);
  const [best, ...rest] = t.combos;
  const lift = best && t.overall.orderRate ? best.conversion.orderRate / t.overall.orderRate : 0;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="ماذا تريد العميلات؟" sub="Trend Lab — قراءة لاختيارات العميلات، وليست توقعًا مؤكدًا للمبيعات." action={<WindowTabs days={days} base="/dashboard/trends" />} />
      {!best ? (
        <Card><p className="py-10 text-center text-muted">لا توجد بيانات كافية بعد.</p></Card>
      ) : (
        <>
          <section className="rounded-3xl bg-ink p-6 text-paper lg:p-8">
            <p className="text-sm text-paper/60">خلال آخر {days} يومًا، أكثر تركيبة تم اختيارها:</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {best.parts.map((p, i) => (
                <span key={p.group} className="flex items-center gap-2">
                  <span className="rounded-xl bg-white/10 px-4 py-2.5">
                    <span className="block text-[11px] text-paper/50">{p.label}</span>
                    <span className="font-display text-lg">{p.name}</span>
                  </span>
                  {i < best.parts.length - 1 && <span className="text-paper/40">+</span>}
                </span>
              ))}
            </div>
            <p className="num mt-5 text-sm text-paper/70">
              {fmtN(best.count)} تصميم ({fmtPct(best.pct, 1)} من {fmtN(t.n)}) · أُضيف للسلة {fmtPct(best.conversion.cartRate)} · تحويل إلى طلب {fmtPct(best.conversion.orderRate)}
            </p>
          </section>

          <section className="mt-4 rounded-3xl border border-gold/30 bg-gold-soft p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-gold"><Icon name="sparkle" /></span>
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold">فرصة جديدة</h2>
                <p className="mt-1 leading-relaxed text-ink-2">
                  قد يكون من المفيد تجربة إنتاج هذه التركيبة كعباية جاهزة.
                  {lift >= 1.1 && best.conversion.n >= 30 && <> معدل تحويلها إلى طلب أعلى من المتوسط بنحو {fmtPct(lift - 1)}.</>}
                </p>
                <p className="mt-2 text-xs text-muted">مبنية على بيانات الاختيارات في المتجر فقط — جرّبي بكمية محدودة أولًا وراقبي النتائج.</p>
                <div className="mt-4"><ConvertButton config={best.config} label="حوّلي التركيبة إلى منتج" size="md" variant="primary" /></div>
              </div>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="تركيبات أخرى رائجة">
              <ol className="space-y-3">
                {rest.map((c, i) => (
                  <li key={c.key} className="flex items-start gap-3 text-sm">
                    <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-sand text-xs">{i + 2}</span>
                    <span className="flex-1 leading-relaxed">{c.parts.map((p) => p.name).join(" + ")}</span>
                    <span className="num text-muted">{fmtPct(c.pct, 1)}</span>
                  </li>
                ))}
              </ol>
            </Card>
            <Card title={`ما الذي يتغير؟ (مقارنة بالـ${days} يومًا السابقة)`}>
              <ul className="space-y-2.5">
                {t.movers.map((mv) => (
                  <li key={mv.group + mv.code} className="flex items-center justify-between gap-3 text-sm">
                    <span><span className="text-muted">{GROUP_META[mv.group].label}:</span> {mv.name}</span>
                    <span className={cx("num", mv.delta >= 0 ? "text-ok" : "text-danger")}>
                      {mv.delta >= 0 ? "▲" : "▼"} {(Math.abs(mv.delta) * 100).toFixed(1)} نقطة
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
