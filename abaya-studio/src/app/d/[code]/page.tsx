import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui";
import { optionFor } from "@/lib/engine/config";
import { formatSAR } from "@/lib/engine/pricing";
import { GROUP_META, SINGLE_GROUPS } from "@/lib/engine/types";
import { loadCatalog } from "@/lib/services/catalog";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";

async function load(code: string) {
  const design = await (await getRepo()).getDesignByCode(code);
  if (!design) return null;
  return { design, catalog: await loadCatalog(design.storeId) };
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Abaya Design #${code}`,
    description: "شوفي العباية اللي صممتها ✨",
    openGraph: { title: `Abaya Design #${code}`, description: "شوفي العباية اللي صممتها ✨" },
  };
}

export default async function SharedDesign({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const data = await load(code);
  if (!data) notFound();
  const { design, catalog } = data;
  const front = design.images.find((i) => i.view === "front")?.url ?? `/api/render?design=${design.code}&mode=photo`;
  const back = design.images.find((i) => i.view === "back")?.url ?? `/api/render?design=${design.code}&mode=photo&view=back`;
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4"><Logo /></div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {[front, back].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={i ? "الخلف" : "الأمام"} className="aspect-[400/776] w-full rounded-2xl bg-sand object-cover" />
          ))}
        </div>
        <div>
          <p className="num text-sm text-muted" dir="ltr">Abaya Design #{design.code}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">شوفي العباية اللي صممتها ✨</h1>
          <p className="mt-1 text-muted">{catalog.storeName}</p>
          <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
            {SINGLE_GROUPS.map((g) => (
              <div key={g} className="flex justify-between px-4 py-2.5 text-sm">
                <dt className="text-muted">{GROUP_META[g].label}</dt>
                <dd className="font-medium">{optionFor(catalog, g, design.config[g])?.name ?? design.config[g]}</dd>
              </div>
            ))}
            {design.config.extras.length > 0 && (
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <dt className="text-muted">الإضافات</dt>
                <dd className="font-medium">{design.config.extras.map((c) => optionFor(catalog, "extra", c)?.name ?? c).join("، ")}</dd>
              </div>
            )}
          </dl>
          <p className="num mt-5 font-display text-3xl font-semibold">{formatSAR(design.price.total)}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href={`/studio?design=${design.code}`} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink text-paper">افتحي التصميم وعدّلي عليه</Link>
            <Link href="/studio" className="flex h-12 flex-1 items-center justify-center rounded-xl border border-line-2 bg-white">صممي عبايتك</Link>
          </div>
          <p className="mt-4 text-xs text-muted">الصورة تصور بصري تقريبي، والمواصفات المعتمدة هي المذكورة أعلاه.</p>
        </div>
      </main>
    </div>
  );
}
