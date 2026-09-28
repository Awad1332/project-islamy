import type { ScreenKind } from "@/content/site";
import { cn } from "@/lib/cn";
import { ProductArt } from "./ProductArt";

const P = "#7047EB";

/** Small phone-like screen illustrating one step of the shopping journey. */
export function MiniScreen({ kind, className, active = false }: { kind: ScreenKind; className?: string; active?: boolean }) {
  return (
    <div aria-hidden className={cn("mock", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-[9cqw] bg-white p-[6cqw] text-[6.5cqw] text-ink ring-1 transition-all duration-500",
          active ? "shadow-float ring-primary/40" : "shadow-soft ring-line",
        )}
      >
        {screens[kind]}
      </div>
    </div>
  );
}

const Bar = ({ w, c = "bg-ink/10", h = "h-[3.2cqw]" }: { w: string; c?: string; h?: string }) => (
  <span className={cn("block rounded-full", h, c)} style={{ width: w }} />
);

const screens: Record<ScreenKind, React.ReactNode> = {
  home: (
    <div className="space-y-[5cqw]">
      <div className="flex items-center justify-between">
        <Bar w="30%" c="bg-ink/80" h="h-[4.5cqw]" />
        <span className="size-[9cqw] rounded-full bg-primary" />
      </div>
      <div className="flex items-center rounded-[6cqw] bg-lilac p-[5cqw]">
        <div className="flex-1 space-y-[3cqw]">
          <Bar w="85%" c="bg-ink/70" h="h-[4cqw]" />
          <Bar w="60%" c="bg-ink/30" />
          <span className="mt-[2cqw] block h-[7cqw] w-[45%] rounded-full bg-primary" />
        </div>
        <ProductArt kind="perfume" tint={P} className="w-[38%]" />
      </div>
      <div className="flex gap-[3cqw]">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-[7cqw] flex-1 rounded-full", i === 0 ? "bg-ink" : "bg-ink/[0.06]")} />
        ))}
      </div>
    </div>
  ),
  category: (
    <div className="space-y-[4cqw]">
      <div className="flex items-center justify-between">
        <Bar w="40%" c="bg-ink/80" h="h-[4.5cqw]" />
        <span className="rounded-full bg-lilac px-[3cqw] py-[1.5cqw] text-[4.5cqw] text-primary">فلترة</span>
      </div>
      <div className="grid grid-cols-2 gap-[4cqw]">
        {(["serum", "perfume", "lipstick", "ring"] as const).map((k) => (
          <div key={k} className="rounded-[5cqw] bg-alt p-[2cqw]">
            <ProductArt kind={k} tint={P} className="w-full" />
            <Bar w="70%" c="bg-ink/20" h="h-[2.6cqw]" />
          </div>
        ))}
      </div>
    </div>
  ),
  product: (
    <div className="space-y-[4cqw]">
      <div className="rounded-[6cqw] bg-lilac p-[4cqw]">
        <ProductArt kind="perfume" tint={P} className="mx-auto w-[70%]" />
      </div>
      <Bar w="75%" c="bg-ink/80" h="h-[4.5cqw]" />
      <div className="flex items-center gap-[2cqw] text-[5cqw] font-bold text-primary">٣٤٥ ر.س</div>
      <div className="flex gap-[2.5cqw]">
        {["50ml", "100ml"].map((s, i) => (
          <span
            key={s}
            dir="ltr"
            className={cn("rounded-full px-[3cqw] py-[1.2cqw] text-[4cqw] ring-1", i ? "text-primary ring-primary" : "ring-line")}
          >
            {s}
          </span>
        ))}
      </div>
      <span className="block rounded-full bg-primary py-[2.5cqw] text-center text-[4.6cqw] font-semibold text-white">
        أضف للسلة
      </span>
    </div>
  ),
  cart: (
    <div className="space-y-[4cqw]">
      <Bar w="35%" c="bg-ink/80" h="h-[4.5cqw]" />
      {(["perfume", "incense"] as const).map((k) => (
        <div key={k} className="flex items-center gap-[3cqw] rounded-[5cqw] bg-alt p-[2.5cqw]">
          <div className="w-[26%] rounded-[3cqw] bg-white">
            <ProductArt kind={k} tint={P} className="w-full" />
          </div>
          <div className="flex-1 space-y-[2cqw]">
            <Bar w="80%" c="bg-ink/40" />
            <Bar w="40%" c="bg-primary/60" />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-[2cqw] rounded-[4cqw] border border-dashed border-primary/40 p-[2.5cqw] text-[4cqw] text-deep">
        <span className="size-[4cqw] rounded-full bg-emerald-500" /> توصيل مجاني لطلبك
      </div>
      <span className="block rounded-full bg-primary py-[2.5cqw] text-center text-[4.6cqw] font-semibold text-white">
        متابعة الشراء
      </span>
    </div>
  ),
  checkout: (
    <div className="space-y-[4cqw]">
      <div className="flex items-center gap-[2cqw]">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("h-[2cqw] flex-1 rounded-full", i < 3 ? "bg-primary" : "bg-primary/25")} />
        ))}
      </div>
      <div className="space-y-[2.5cqw] rounded-[5cqw] bg-alt p-[3.5cqw]">
        <Bar w="50%" c="bg-ink/50" />
        <span className="block h-[8cqw] rounded-[2.5cqw] bg-white ring-1 ring-line" />
        <span className="block h-[8cqw] rounded-[2.5cqw] bg-white ring-1 ring-line" />
      </div>
      <div className="flex flex-col items-center gap-[2cqw] py-[2cqw]">
        <span className="grid size-[13cqw] place-items-center rounded-full bg-emerald-500 text-white">
          <svg viewBox="0 0 24 24" className="size-[7cqw]" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="text-[4.6cqw] font-semibold">تم تأكيد طلبك</span>
      </div>
    </div>
  ),
};
