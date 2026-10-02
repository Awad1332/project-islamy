import Link from "next/link";
import { cx } from "@/lib/cx";

export function WindowTabs({ days, base }: { days: number; base: string }) {
  return (
    <div className="flex rounded-full bg-white p-1 text-sm ring-1 ring-line">
      {[7, 30, 90].map((d) => (
        <Link key={d} href={`${base}?days=${d}`} className={cx("num rounded-full px-3.5 py-1.5", d === days ? "bg-ink text-paper" : "text-ink-2")}>
          {d} يومًا
        </Link>
      ))}
    </div>
  );
}

export const parseDays = (v?: string) => ([7, 30, 90].includes(Number(v)) ? Number(v) : 30);
