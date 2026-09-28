import type { CSSProperties } from "react";
import type { StoreTheme } from "@/content/site";
import { cn } from "@/lib/cn";
import { ProductArt, type ProductKind } from "./ProductArt";

export const productNames: Record<ProductKind, string> = {
  perfume: "عطر عود ملكي",
  abaya: "عباية كريب",
  serum: "سيروم مرطب",
  ring: "خاتم ذهبي",
  headphones: "سماعة لاسلكية",
  phone: "هاتف ذكي",
  watch: "ساعة ذكية",
  coffee: "قهوة مختصة",
  vase: "مزهرية فخارية",
  bag: "حقيبة جلدية",
  incense: "مبخرة نحاسية",
  lipstick: "أحمر شفاه",
  digital: "دورة رقمية",
  service: "باقة خدمات",
};

const prices = ["٣٤٥", "١٨٩", "٢٤٠", "٤٢٠", "١٥٥", "٢٩٩"];

type MockProps = {
  theme: StoreTheme;
  storeName: string;
  tagline?: string;
  products: ProductKind[];
  className?: string;
  /** Optional label for screen readers; mockups are decorative by default. */
  label?: string;
};

const vars = (t: StoreTheme) =>
  ({
    "--m-primary": t.primary,
    "--m-soft": t.soft,
    "--m-ink": t.ink,
    "--m-surface": t.surface,
  }) as CSSProperties;

/* ───────────────────────────── Desktop ───────────────────────────── */

export function DesktopMockup({
  theme,
  storeName,
  tagline = "مجموعة جديدة بتفاصيل مختلفة",
  products,
  className,
  label,
}: MockProps) {
  const hero = products[0];
  return (
    <Frame className={className} theme={theme} label={label}>
      <div className="overflow-hidden rounded-[1.4cqw] bg-white shadow-float ring-1 ring-black/5">
        {/* Browser chrome */}
        <div dir="ltr" className="flex items-center gap-[0.8cqw] border-b border-black/5 bg-[#f6f5f9] px-[1.6cqw] py-[1cqw]">
          <span className="size-[0.9cqw] rounded-full bg-[#ff6259]" />
          <span className="size-[0.9cqw] rounded-full bg-[#ffbd2e]" />
          <span className="size-[0.9cqw] rounded-full bg-[#28c840]" />
          <span className="mx-auto h-[1.9cqw] w-[36%] rounded-full bg-white ring-1 ring-black/5" />
        </div>

        <div className="bg-[var(--m-surface)] text-[1.3cqw] text-[var(--m-ink)]">
          {/* Store header */}
          <div className="flex items-center justify-between px-[3cqw] py-[1.6cqw]">
            <span className="text-[1.9cqw] font-bold">{storeName}</span>
            <div className="flex gap-[2.4cqw] opacity-70">
              <span>الرئيسية</span>
              <span>وصل حديثًا</span>
              <span>الأقسام</span>
              <span>العروض</span>
            </div>
            <div className="flex items-center gap-[1.2cqw]">
              <span className="size-[2.6cqw] rounded-full bg-[var(--m-soft)]" />
              <span className="relative size-[2.6cqw] rounded-full bg-[var(--m-primary)]">
                <span className="absolute -top-[0.4cqw] -left-[0.4cqw] size-[1.3cqw] rounded-full border-[0.25cqw] border-white bg-[#ff7a59]" />
              </span>
            </div>
          </div>

          {/* Banner */}
          <div className="mx-[3cqw] flex items-center justify-between overflow-hidden rounded-[1.4cqw] bg-[var(--m-soft)] px-[3.5cqw] py-[2.6cqw]">
            <div className="max-w-[48%]">
              <span className="inline-block rounded-full bg-white/80 px-[1.2cqw] py-[0.4cqw] text-[1.1cqw] font-semibold text-[var(--m-primary)]">
                مجموعة الموسم
              </span>
              <p className="mt-[1.2cqw] text-[3cqw] leading-[1.25] font-bold">{tagline}</p>
              <div className="mt-[1.4cqw] flex gap-[1cqw]">
                <span className="rounded-full bg-[var(--m-primary)] px-[2cqw] py-[0.8cqw] font-semibold text-white">
                  تسوّق الآن
                </span>
                <span className="rounded-full bg-white px-[2cqw] py-[0.8cqw] font-medium">اكتشف المزيد</span>
              </div>
            </div>
            <div className="relative -my-[1cqw] w-[30%]">
              <div className="absolute inset-[8%] rounded-full bg-white/70" />
              <ProductArt kind={hero} tint={theme.primary} className="relative w-full" />
            </div>
          </div>

          {/* Chips */}
          <div className="flex gap-[1cqw] px-[3cqw] pt-[2cqw]">
            {["الكل", "الأكثر مبيعًا", "جديدنا", "هدايا"].map((c, i) => (
              <span
                key={c}
                className={cn(
                  "rounded-full px-[1.6cqw] py-[0.6cqw] text-[1.1cqw]",
                  i === 0 ? "bg-[var(--m-ink)] text-white" : "bg-black/[0.04]",
                )}
              >
                {c}
              </span>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-4 gap-[1.6cqw] px-[3cqw] pt-[1.6cqw] pb-[3cqw]">
            {products.slice(0, 4).map((p, i) => (
              <div key={i} className="rounded-[1.1cqw] bg-white p-[0.8cqw] ring-1 ring-black/5">
                <div className="relative rounded-[0.8cqw] bg-[var(--m-soft)] p-[0.8cqw]">
                  <ProductArt kind={p} tint={theme.primary} className="w-full" />
                  {i === 1 && (
                    <span className="absolute top-[0.8cqw] right-[0.8cqw] rounded-full bg-[var(--m-primary)] px-[0.8cqw] py-[0.2cqw] text-[0.95cqw] text-white">
                      جديد
                    </span>
                  )}
                </div>
                <p className="mt-[0.8cqw] truncate text-[1.15cqw] font-semibold">{productNames[p]}</p>
                <div className="mt-[0.4cqw] flex items-center justify-between">
                  <span className="text-[1.1cqw] font-bold text-[var(--m-primary)]">{prices[i]} ر.س</span>
                  <span className="size-[2cqw] rounded-full bg-[var(--m-ink)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ───────────────────────────── Mobile ───────────────────────────── */

export function MobileMockup({ theme, storeName, tagline = "تفاصيل تستحق الاقتناء", products, className, label }: MockProps) {
  return (
    <Frame className={className} theme={theme} label={label}>
      <div className="rounded-[14cqw] bg-[#15121c] p-[3.2cqw] shadow-float">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[11cqw] bg-[var(--m-surface)] text-[4.2cqw] text-[var(--m-ink)]">
          <div className="absolute top-[2.4cqw] left-1/2 z-10 h-[6cqw] w-[30cqw] -translate-x-1/2 rounded-full bg-[#15121c]" />
          {/* header */}
          <div className="flex items-center justify-between px-[6cqw] pt-[13cqw] pb-[3cqw]">
            <span className="flex flex-col gap-[1.2cqw]">
              <span className="h-[0.9cqw] w-[6cqw] rounded bg-[var(--m-ink)]" />
              <span className="h-[0.9cqw] w-[4cqw] rounded bg-[var(--m-ink)]" />
            </span>
            <span className="text-[5.4cqw] font-bold">{storeName}</span>
            <span className="size-[7cqw] rounded-full bg-[var(--m-primary)]" />
          </div>
          {/* search */}
          <div className="mx-[5cqw] rounded-full bg-black/[0.04] px-[4cqw] py-[2.4cqw] text-[3.6cqw] opacity-60">
            ابحث عن منتج...
          </div>
          {/* banner */}
          <div className="mx-[5cqw] mt-[4cqw] flex items-center overflow-hidden rounded-[5cqw] bg-[var(--m-soft)] p-[4cqw]">
            <div className="flex-1">
              <p className="text-[5.2cqw] leading-[1.3] font-bold">{tagline}</p>
              <span className="mt-[2.5cqw] inline-block rounded-full bg-[var(--m-primary)] px-[3.5cqw] py-[1.4cqw] text-[3.4cqw] text-white">
                تسوّق الآن
              </span>
            </div>
            <ProductArt kind={products[0]} tint={theme.primary} className="w-[38%]" />
          </div>
          {/* grid */}
          <div className="grid grid-cols-2 gap-[3cqw] px-[5cqw] pt-[4cqw]">
            {products.slice(0, 4).map((p, i) => (
              <div key={i} className="rounded-[4cqw] bg-white p-[2cqw] ring-1 ring-black/5">
                <div className="rounded-[3cqw] bg-[var(--m-soft)] p-[1.5cqw]">
                  <ProductArt kind={p} tint={theme.primary} className="w-full" />
                </div>
                <p className="mt-[1.5cqw] truncate text-[3.4cqw] font-semibold">{productNames[p]}</p>
                <p className="text-[3.2cqw] font-bold text-[var(--m-primary)]">{prices[i]} ر.س</p>
              </div>
            ))}
          </div>
          {/* tab bar */}
          <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-black/5 bg-white/95 px-[6cqw] pt-[3cqw] pb-[6cqw]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("size-[6cqw] rounded-[2cqw]", i === 0 ? "bg-[var(--m-primary)]" : "bg-black/10")} />
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ───────────────────────────── Tablet ───────────────────────────── */

export function TabletMockup({ theme, storeName, tagline = "اختيارات مميزة لك", products, className, label }: MockProps) {
  return (
    <Frame className={className} theme={theme} label={label}>
      <div className="rounded-[5cqw] bg-[#15121c] p-[2.4cqw] shadow-float">
        <div className="aspect-[3/4] overflow-hidden rounded-[3cqw] bg-[var(--m-surface)] text-[2.6cqw] text-[var(--m-ink)]">
          <div className="flex items-center justify-between px-[5cqw] pt-[4cqw] pb-[3cqw]">
            <span className="text-[3.8cqw] font-bold">{storeName}</span>
            <div className="flex gap-[2cqw]">
              <span className="size-[5cqw] rounded-full bg-[var(--m-soft)]" />
              <span className="size-[5cqw] rounded-full bg-[var(--m-primary)]" />
            </div>
          </div>
          <div className="mx-[5cqw] flex items-center rounded-[3cqw] bg-[var(--m-soft)] p-[4cqw]">
            <div className="flex-1">
              <p className="text-[4.4cqw] leading-[1.3] font-bold">{tagline}</p>
              <span className="mt-[2cqw] inline-block rounded-full bg-[var(--m-primary)] px-[3cqw] py-[1.2cqw] text-white">
                تسوّق الآن
              </span>
            </div>
            <ProductArt kind={products[1] ?? products[0]} tint={theme.primary} className="w-[36%]" />
          </div>
          <div className="grid grid-cols-3 gap-[2.4cqw] px-[5cqw] pt-[4cqw]">
            {[...products, ...products].slice(0, 6).map((p, i) => (
              <div key={i} className="rounded-[2.4cqw] bg-white p-[1.4cqw] ring-1 ring-black/5">
                <div className="rounded-[1.8cqw] bg-[var(--m-soft)] p-[1cqw]">
                  <ProductArt kind={p} tint={theme.primary} className="w-full" />
                </div>
                <span className="mt-[1.2cqw] block h-[1.3cqw] w-[80%] rounded bg-black/15" />
                <span className="mt-[1cqw] block h-[1.3cqw] w-[45%] rounded bg-[var(--m-primary)]/70" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/** Outer element establishes the size container so inner `cqw` units scale with the mockup. */
function Frame({
  className,
  theme,
  label,
  children,
}: {
  className?: string;
  theme: StoreTheme;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("mock", className)}
      style={vars(theme)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </div>
  );
}
