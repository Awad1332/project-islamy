"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cx, Icon, Logo } from "../ui";

const NAV = [
  { href: "/dashboard", label: "الرئيسية", icon: "grid" },
  { href: "/dashboard/insights", label: "التفضيلات", icon: "chart" },
  { href: "/dashboard/trends", label: "Trend Lab", icon: "flask" },
  { href: "/dashboard/designs", label: "التصميمات", icon: "eye" },
  { href: "/dashboard/products", label: "المنتجات", icon: "box" },
  { href: "/dashboard/options", label: "خيارات التصميم", icon: "layers" },
  { href: "/dashboard/sizes", label: "المقاسات", icon: "ruler" },
];

export function DashboardNav({ storeName, email }: { storeName: string; email: string }) {
  const path = usePathname();
  const router = useRouter();
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  };
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line bg-white px-4 py-5 lg:flex">
        <Logo />
        <div className="mt-6 rounded-xl bg-sand px-3 py-2.5">
          <p className="text-xs text-muted">المتجر</p>
          <p className="truncate text-sm font-medium">{storeName}</p>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cx("flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors", active(n.href) ? "bg-ink text-paper" : "text-ink-2 hover:bg-sand")}>
              <Icon name={n.icon} className="size-[18px]" /> {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/studio" target="_blank" className="mb-2 flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-ink-2 hover:bg-sand">
          <Icon name="sparkle" className="size-[18px]" /> معاينة تجربة العميلة
        </Link>
        <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
          <span className="truncate" dir="ltr">{email}</span>
          <button onClick={logout} className="grid size-8 place-items-center rounded-lg hover:bg-sand" aria-label="تسجيل الخروج"><Icon name="logout" className="size-4" /></button>
        </div>
      </aside>
      {/* Mobile top bar + tabs */}
      <div className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo compact />
          <span className="truncate text-sm font-medium">{storeName}</span>
          <button onClick={logout} className="grid size-9 place-items-center rounded-lg hover:bg-sand" aria-label="تسجيل الخروج"><Icon name="logout" className="size-4" /></button>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cx("flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm", active(n.href) ? "bg-ink text-paper" : "bg-white text-ink-2 ring-1 ring-line")}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
