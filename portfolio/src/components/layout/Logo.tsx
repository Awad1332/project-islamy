import Link from "next/link";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br from-primary to-deep text-white shadow-[0_8px_20px_-8px_rgb(112_71_235/0.8)]",
        className,
      )}
    >
      <span className="absolute -top-3 -left-3 size-8 rounded-full bg-white/20" />
      <span className="relative text-xl leading-none font-bold">ع</span>
    </span>
  );
}

export function Logo({ tone = "dark", withDescriptor = true }: { tone?: "dark" | "light"; withDescriptor?: boolean }) {
  return (
    <Link href="/#home" className="flex items-center gap-3" aria-label={`${site.nameAr} — الصفحة الرئيسية`}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className={cn("text-lg font-bold", tone === "dark" ? "text-ink" : "text-white")}>{site.nameAr}</span>
        {withDescriptor && (
          <span className={cn("hidden text-xs sm:block", tone === "dark" ? "text-muted" : "text-white/60")}>
            {site.descriptor}
          </span>
        )}
      </span>
    </Link>
  );
}
