import { BarList, Card, fmtN } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { parseDays, WindowTabs } from "@/components/dashboard/WindowTabs";
import { currentMerchant } from "@/lib/services/auth";
import { insights } from "@/lib/services/analytics";
import { loadCatalog } from "@/lib/services/catalog";

export default async function Insights({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = parseDays((await searchParams).days);
  const m = (await currentMerchant())!;
  const data = await insights(await loadCatalog(m.storeId), days);
  const top = (i: number) => data.groups[i].shares[0];
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="تحليلات التفضيلات" sub={`مبنية على ${fmtN(data.n)} تصميم`} action={<WindowTabs days={days} base="/dashboard/insights" />} />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => top(i) && (
          <div key={i} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm text-muted">{["أكثر قصة اختيارًا", "أكثر طول", "أكثر لون"][i]}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{top(i).name}</p>
            <p className="num mt-1 text-3xl font-semibold text-gold">{Math.round(top(i).pct * 100)}%</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.groups.map((g) => (
          <Card key={g.group} title={g.title}>
            <BarList items={g.shares.map((s) => ({ key: s.code, label: s.name, pct: s.pct, count: s.count }))} />
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">النسب في «الإضافات» من إجمالي التصميمات، ويمكن أن يتضمن التصميم أكثر من إضافة.</p>
    </div>
  );
}
