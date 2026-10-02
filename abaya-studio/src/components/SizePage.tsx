"use client";

import Link from "next/link";
import type { StoreCatalog } from "@/lib/engine/types";
import { SizeAssistant } from "./studio/SizeAssistant";
import { Icon, Logo } from "./ui";

export function SizePage({ catalog }: { catalog: StoreCatalog }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Logo />
          <Link href="/studio" className="text-sm text-ink-2 underline underline-offset-4">صممي عباية</Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-sand"><Icon name="ruler" /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold">ساعديني أختار مقاسي</h1>
            <p className="text-sm text-muted">خمسة أسئلة سريعة، مبنية على جدول مقاسات {catalog.storeName}.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-white p-5 sm:p-7">
          <SizeAssistant catalog={catalog} />
        </div>
        <details className="mt-6 rounded-2xl border border-line bg-white p-4 text-sm">
          <summary className="cursor-pointer font-medium">جدول المقاسات</summary>
          <table className="num mt-3 w-full text-center">
            <thead className="text-muted">
              <tr><th className="py-1.5 font-normal">المقاس</th><th className="font-normal">الطول</th><th className="font-normal">الصدر</th><th className="font-normal">لطول الجسم</th></tr>
            </thead>
            <tbody>
              {catalog.sizeChart.map((r) => (
                <tr key={r.size} className="border-t border-line">
                  <td className="py-2 font-medium">{r.size}</td><td>{r.lengthCm} سم</td><td>{r.bustCm} سم</td><td>{r.minHeight}–{r.maxHeight} سم</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </main>
    </div>
  );
}
