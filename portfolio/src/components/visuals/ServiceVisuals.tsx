import type { ServiceVisual, StoreTheme } from "@/content/site";
import { cn } from "@/lib/cn";
import { DesktopMockup, MobileMockup, TabletMockup } from "./StoreMockup";
import { MiniScreen } from "./MiniScreen";
import { ProductArt } from "./ProductArt";
import { Sphere, Capsule } from "./Shapes";

const purple: StoreTheme = { primary: "#7047EB", soft: "#F2EDFF", ink: "#19152B", surface: "#FFFFFF" };
const sand: StoreTheme = { primary: "#8A5A44", soft: "#F6EEE8", ink: "#2B1F1A", surface: "#FFFCFA" };

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative isolate aspect-[5/4] w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-lilac via-[#f7f4ff] to-alt ring-1 ring-line",
        className,
      )}
    >
      <div
        aria-hidden
        className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]"
      />
      {children}
    </div>
  );
}

export function ServiceVisualFor({ kind }: { kind: ServiceVisual }) {
  switch (kind) {
    case "store":
      return <StoreVisual />;
    case "journey":
      return <JourneyVisual />;
    case "components":
      return <ComponentsVisual />;
    case "beforeAfter":
      return <BeforeAfterVisual />;
    case "brand":
      return <BrandVisual />;
  }
}

/* 01 — Desktop + mobile store */
function StoreVisual() {
  return (
    <Panel>
      <Sphere className="absolute -top-10 -left-10 size-40 opacity-80" tone="light" />
      <DesktopMockup
        theme={sand}
        storeName="ليان"
        tagline="أناقة هادئة لكل يوم"
        products={["abaya", "bag", "abaya", "abaya"]}
        className="absolute top-[12%] right-[6%] w-[80%]"
      />
      <MobileMockup
        theme={sand}
        storeName="ليان"
        products={["abaya", "bag", "abaya", "abaya"]}
        className="absolute bottom-[-18%] left-[6%] w-[27%] motion-safe:animate-float-slow"
      />
    </Panel>
  );
}

/* 02 — Journey map */
function JourneyVisual() {
  const steps = [
    { k: "home", t: "الرئيسية" },
    { k: "category", t: "القسم" },
    { k: "product", t: "المنتج" },
    { k: "cart", t: "السلة" },
    { k: "checkout", t: "الدفع" },
  ] as const;
  // Zig-zag positions (percent of panel), right → left in RTL reading order.
  const pos = [
    { top: "8%", right: "5%" },
    { top: "40%", right: "24%" },
    { top: "8%", right: "41%" },
    { top: "40%", right: "58%" },
    { top: "8%", right: "76%" },
  ];
  return (
    <Panel>
      <svg aria-hidden viewBox="0 0 100 80" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path
          d="M86 22 C 80 40, 74 45, 67 52 S 55 30, 50 24 S 38 45, 33 52 S 20 30, 14 24"
          fill="none"
          stroke="#7047EB"
          strokeOpacity="0.45"
          strokeWidth="0.5"
          strokeDasharray="1.4 1.4"
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 2 }}
        />
      </svg>
      {steps.map((s, i) => (
        <div key={s.k} className="absolute w-[19%]" style={pos[i]}>
          <MiniScreen kind={s.k} active={i === 2} className={cn(i === 2 && "-translate-y-1.5")} />
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[clamp(0.6rem,1.4vw,0.85rem)] font-semibold text-deep">
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] text-white">{i + 1}</span>
            {s.t}
          </p>
        </div>
      ))}
    </Panel>
  );
}

/* 03 — Components + responsive previews */
function ComponentsVisual() {
  return (
    <Panel>
      <div className="absolute top-[7%] right-[6%] w-[52%] rounded-2xl bg-white p-[3.5%] shadow-card ring-1 ring-line">
        <p className="mb-3 text-[clamp(0.65rem,1.2vw,0.8rem)] font-semibold text-muted">مكوّنات الواجهة</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary px-3 py-1.5 text-[clamp(0.6rem,1.1vw,0.75rem)] font-semibold text-white">
            أضف للسلة
          </span>
          <span className="rounded-full px-3 py-1.5 text-[clamp(0.6rem,1.1vw,0.75rem)] font-semibold text-primary ring-1 ring-primary/40">
            المفضلة
          </span>
          <span className="rounded-full bg-lilac px-3 py-1.5 text-[clamp(0.6rem,1.1vw,0.75rem)] font-semibold text-deep">
            خصم ١٥٪
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-alt px-3 py-2 ring-1 ring-line">
          <span className="size-3 rounded-full ring-2 ring-primary/50" />
          <span className="h-2 w-2/3 rounded-full bg-ink/15" />
        </div>
        <div className="mt-3 flex gap-1.5">
          {["#7047EB", "#40218C", "#F2EDFF", "#19152B", "#EAE7F1"].map((c) => (
            <span key={c} className="h-6 flex-1 rounded-md ring-1 ring-black/5" style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="absolute top-[7%] left-[6%] w-[30%] rounded-2xl bg-white p-[2.5%] shadow-card ring-1 ring-line">
        <div className="rounded-xl bg-lilac p-2">
          <ProductArt kind="perfume" className="w-full" />
        </div>
        <span className="mt-2 block h-2 w-4/5 rounded-full bg-ink/60" />
        <span className="mt-1.5 block h-2 w-2/5 rounded-full bg-primary/70" />
        <span className="mt-2 block rounded-full bg-ink py-1.5 text-center text-[clamp(0.55rem,1vw,0.7rem)] text-white">
          شراء
        </span>
      </div>
      <div className="absolute right-[6%] bottom-[-6%] flex w-[88%] items-end justify-between gap-[3%]">
        <DesktopMockup theme={purple} storeName="متجر" products={["perfume", "serum", "ring", "watch"]} className="w-[58%]" />
        <TabletMockup theme={purple} storeName="متجر" products={["perfume", "serum", "ring"]} className="w-[22%]" />
        <MobileMockup theme={purple} storeName="متجر" products={["perfume", "serum", "ring", "watch"]} className="w-[14%]" />
      </div>
    </Panel>
  );
}

/* 04 — Before / after (illustrative) */
function BeforeAfterVisual() {
  return (
    <Panel className="aspect-[5/4]">
      <div className="absolute inset-[6%] grid grid-cols-2 gap-[4%]">
        {/* Before */}
        <figure className="flex flex-col">
          <figcaption className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted ring-1 ring-line">
            <span className="size-1.5 rounded-full bg-[#e0625a]" /> قبل
          </figcaption>
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-white p-[6%] ring-1 ring-line grayscale-[35%]">
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="h-2 rounded-sm bg-ink/20" style={{ width: `${18 + ((i * 13) % 20)}%` }} />
              ))}
            </div>
            <div className="mt-2 h-[18%] rounded-md bg-gradient-to-l from-[#ffcf5c] via-[#ff7a59] to-[#5ac8fa]" />
            <div className="mt-2 grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="aspect-square rounded-sm bg-ink/10" />
              ))}
            </div>
            <div className="mt-2 flex gap-1">
              <span className="h-3 flex-1 rounded-sm bg-[#ff7a59]/70" />
              <span className="h-3 flex-1 rounded-sm bg-[#5ac8fa]/70" />
              <span className="h-3 flex-1 rounded-sm bg-[#8bc34a]/70" />
            </div>
          </div>
        </figure>
        {/* After */}
        <figure className="flex flex-col">
          <figcaption className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
            <span className="size-1.5 rounded-full bg-white" /> بعد
          </figcaption>
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-white p-[6%] shadow-card ring-1 ring-primary/25">
            <div className="flex items-center justify-between">
              <span className="h-2.5 w-1/3 rounded-full bg-ink/70" />
              <span className="size-4 rounded-full bg-primary" />
            </div>
            <div className="mt-3 flex items-center rounded-xl bg-lilac p-[6%]">
              <div className="flex-1 space-y-1.5">
                <span className="block h-2.5 w-4/5 rounded-full bg-ink/70" />
                <span className="block h-2 w-1/2 rounded-full bg-ink/25" />
                <span className="mt-1 block h-3.5 w-2/5 rounded-full bg-primary" />
              </div>
              <ProductArt kind="perfume" className="w-[38%]" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["serum", "perfume"] as const).map((k) => (
                <div key={k} className="rounded-lg bg-alt p-1">
                  <ProductArt kind={k} className="w-full" />
                </div>
              ))}
            </div>
          </div>
        </figure>
      </div>
      <span className="absolute bottom-[3%] left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-medium text-muted ring-1 ring-line">
        مثال توضيحي لأسلوب التحسين
      </span>
    </Panel>
  );
}

/* 05 — Brand board connected to a store */
function BrandVisual() {
  const brand: StoreTheme = { primary: "#5B3DC8", soft: "#F1ECFF", ink: "#1E1638", surface: "#FFFFFF" };
  return (
    <Panel>
      <Capsule className="absolute -right-8 bottom-10 h-16 w-40 rotate-[-20deg] opacity-80" />
      <div className="absolute top-[7%] right-[6%] w-[46%] rounded-2xl bg-white p-[4%] shadow-card ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#5B3DC8] text-lg font-bold text-white">د</span>
          <div>
            <p className="text-sm font-bold text-ink">دار العود</p>
            <p className="text-[0.7rem] text-muted">دليل الهوية</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {["#5B3DC8", "#1E1638", "#C9A44F", "#F1ECFF"].map((c) => (
            <span key={c} className="aspect-square rounded-lg ring-1 ring-black/5" style={{ background: c }} />
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
          <span className="text-3xl leading-none font-bold text-ink">أ ب</span>
          <span dir="ltr" className="text-2xl leading-none font-light text-muted">
            Aa
          </span>
        </div>
        <div
          className="mt-3 h-8 rounded-lg"
          style={{ background: "repeating-linear-gradient(45deg,#F1ECFF 0 6px,#fff 6px 12px)" }}
        />
      </div>
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path
          d="M52 30 C 45 30, 45 55, 38 55"
          fill="none"
          stroke="#7047EB"
          strokeOpacity="0.5"
          strokeDasharray="1.5 1.5"
          style={{ strokeWidth: 2 }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <DesktopMockup
        theme={brand}
        storeName="دار العود"
        tagline="حكاية عطر تُروى بالتفاصيل"
        products={["perfume", "incense", "perfume", "perfume"]}
        className="absolute bottom-[7%] left-[5%] w-[58%]"
      />
    </Panel>
  );
}
