import Link from "next/link";
import { Card, DailyColumns, Delta, fmtN, fmtPct, StatTile } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Icon } from "@/components/ui";
import { formatSAR } from "@/lib/engine/pricing";
import { currentMerchant } from "@/lib/services/auth";
import { overview } from "@/lib/services/analytics";
import { loadCatalog } from "@/lib/services/catalog";
import { getRepo } from "@/lib/store";
import { optionFor } from "@/lib/engine/config";

export default async function DashboardHome() {
  const m = (await currentMerchant())!;
  const catalog = await loadCatalog(m.storeId);
  const [o, recent] = await Promise.all([overview(catalog, 30), (await getRepo()).listDesigns(m.storeId, { limit: 6 })]);
  const { current: c, previous: p } = o;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="ملخص التصميمات" sub="آخر 30 يومًا مقارنة بالفترة السابقة" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="التصميمات" value={fmtN(c.designs)} delta={<Delta cur={c.designs} prev={p.designs} />} />
        <StatTile label="أُضيفت للسلة" value={fmtN(c.addedToCart)} sub={fmtPct(c.cartRate) + " من التصميمات"} delta={<Delta cur={c.addedToCart} prev={p.addedToCart} />} />
        <StatTile label="تحولت إلى طلب" value={fmtN(c.ordered)} sub={fmtPct(c.orderRate) + " تحويل"} delta={<Delta cur={c.ordered} prev={p.ordered} />} />
        <StatTile label="متوسط قيمة التصميم" value={formatSAR(c.avgValue)} delta={<Delta cur={c.avgValue} prev={p.avgValue} />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="التصميمات اليومية" className="lg:col-span-2">
          <DailyColumns series={o.series} />
        </Card>
        <Card title="من التصميم إلى الطلب">
          <ol className="space-y-4">
            {[
              ["صممت عباية", c.designs, 1],
              ["أضافت للسلة", c.addedToCart, c.cartRate],
              ["أكملت الطلب", c.ordered, c.orderRate],
            ].map(([label, n, r]) => (
              <li key={label as string}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="num text-ink-2">{fmtN(n as number)} · {fmtPct(r as number)}</span>
                </div>
                <div className="h-2 rounded-full bg-sand"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(2, (r as number) * 100)}%` }} /></div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {o.top && (
          <Card title="ماذا تريد العميلات؟" action={<Link href="/dashboard/trends" className="text-sm text-muted underline underline-offset-4">Trend Lab</Link>}>
            <p className="text-sm text-muted">أكثر تركيبة تم اختيارها خلال آخر 30 يومًا:</p>
            <p className="mt-3 font-display text-lg leading-relaxed">{o.top.parts.map((x) => x.name).join(" + ")}</p>
            <p className="num mt-2 text-sm text-muted">{fmtN(o.top.count)} تصميم · {fmtPct(o.top.pct, 1)}</p>
          </Card>
        )}
        <Card title="أحدث التصميمات" className="lg:col-span-2" action={<Link href="/dashboard/designs" className="text-sm text-muted underline underline-offset-4">عرض الكل</Link>}>
          <ul className="divide-y divide-line">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/render?design=${d.code}&crop=torso`} alt="" className="size-10 rounded-lg bg-sand object-cover" loading="lazy" />
                <span className="num w-20 text-muted" dir="ltr">#{d.code}</span>
                <span className="flex-1 truncate">{optionFor(catalog, "cut", d.config.cut)?.name} · {optionFor(catalog, "color", d.config.color)?.name}</span>
                <span className="num">{formatSAR(d.price.total)}</span>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="py-8 text-center text-muted"><Icon name="sparkle" className="mx-auto mb-2" />لم تُصمم أي عباية بعد. شاركي رابط الاستوديو مع عميلاتك.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
