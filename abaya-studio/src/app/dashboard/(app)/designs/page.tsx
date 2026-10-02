import Link from "next/link";
import { ConvertButton } from "@/components/dashboard/ConvertButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge, Icon } from "@/components/ui";
import { cx } from "@/lib/cx";
import { optionFor } from "@/lib/engine/config";
import { formatSAR } from "@/lib/engine/pricing";
import type { DesignStatus } from "@/lib/models";
import { currentMerchant } from "@/lib/services/auth";
import { loadCatalog } from "@/lib/services/catalog";
import { getRepo } from "@/lib/store";

const STATUS: Record<DesignStatus, { label: string; tone: "neutral" | "gold" | "ok" | "dark" }> = {
  draft: { label: "مسودة", tone: "neutral" },
  saved: { label: "محفوظ", tone: "gold" },
  in_cart: { label: "في السلة", tone: "dark" },
  ordered: { label: "تم الطلب", tone: "ok" },
};

export default async function Designs({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (Object.keys(STATUS) as DesignStatus[]).find((s) => s === sp.status);
  const m = (await currentMerchant())!;
  const catalog = await loadCatalog(m.storeId);
  const designs = await (await getRepo()).listDesigns(m.storeId, { limit: 36, status });
  const name = (g: Parameters<typeof optionFor>[1], c: string) => optionFor(catalog, g, c)?.name ?? c;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="التصميمات" sub="اختاري تصميمًا ناجحًا وحوّليه إلى منتج جاهز." />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {[undefined, ...Object.keys(STATUS)].map((s) => (
          <Link key={s ?? "all"} href={s ? `/dashboard/designs?status=${s}` : "/dashboard/designs"} className={cx("h-9 shrink-0 rounded-full px-4 text-sm leading-9", s === status ? "bg-ink text-paper" : "bg-white ring-1 ring-line")}>
            {s ? STATUS[s as DesignStatus].label : "الكل"}
          </Link>
        ))}
      </div>
      {designs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line-2 p-12 text-center text-muted">
          <Icon name="eye" className="mx-auto mb-2 size-7" />
          لا توجد تصميمات في هذا التصنيف.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {designs.map((d) => (
            <article key={d.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
              <Link href={`/d/${d.code}`} target="_blank" className="relative aspect-[4/5] bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.images.find((i) => i.view === "front")?.url ?? `/api/render?design=${d.code}&mode=photo`} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
                <Badge tone={STATUS[d.status].tone} className="absolute top-2 start-2">{STATUS[d.status].label}</Badge>
              </Link>
              <div className="flex flex-1 flex-col gap-1 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="num text-muted" dir="ltr">#{d.code}</span>
                  <span className="num font-semibold">{formatSAR(d.price.total)}</span>
                </div>
                <p className="leading-relaxed">{name("cut", d.config.cut)} · {name("length", d.config.length)} · {name("color", d.config.color)}</p>
                <p className="text-xs text-muted">{name("fabric", d.config.fabric)} · {name("sleeve", d.config.sleeve)} · {name("embroidery", d.config.embroidery)}</p>
                <p className="num text-xs text-muted">{new Date(d.createdAt).toLocaleDateString("ar-SA-u-nu-latn")}</p>
                <div className="mt-auto pt-2"><ConvertButton designCode={d.code} /></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
