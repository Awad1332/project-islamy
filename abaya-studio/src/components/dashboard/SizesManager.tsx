"use client";

import { useState } from "react";
import { groupOptions } from "@/lib/engine/config";
import { recommendSize } from "@/lib/engine/size";
import type { SizeChartRow, StoreCatalog } from "@/lib/engine/types";
import { Button, Icon, useToast } from "../ui";

const COLS: { key: keyof SizeChartRow; label: string }[] = [
  { key: "size", label: "المقاس" },
  { key: "lengthCm", label: "الطول (سم)" },
  { key: "bustCm", label: "الصدر (سم)" },
  { key: "minHeight", label: "من طول" },
  { key: "maxHeight", label: "إلى طول" },
];

export function SizesManager({ initial }: { initial: StoreCatalog }) {
  const toast = useToast();
  const [chart, setChart] = useState(initial.sizeChart);
  const [rules, setRules] = useState(initial.sizeRules);
  const [saving, setSaving] = useState(false);
  const [testH, setTestH] = useState(165);
  const cuts = groupOptions(initial, "cut");

  const update = (i: number, k: keyof SizeChartRow, v: string) =>
    setChart((c) => c.map((r, j) => (j === i ? { ...r, [k]: k === "size" ? v : Number(v) } : r)));

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/merchant/catalog", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ sizeChart: chart, sizeRules: rules }) });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return toast({ message: body.error ?? "تحققي من القيم", tone: "danger" });
    toast({ message: "تم حفظ جدول المقاسات", tone: "ok" });
  };

  const test = chart.length ? recommendSize({ sizeChart: chart, sizeRules: rules }, { heightCm: testH, cut: "wide", heels: "never" }) : null;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="num w-full min-w-[560px] text-sm">
          <thead className="bg-sand text-muted">
            <tr>{COLS.map((c) => <th key={c.key} className="px-3 py-2.5 text-start font-normal">{c.label}</th>)}<th /></tr>
          </thead>
          <tbody>
            {chart.map((r, i) => (
              <tr key={i} className="border-t border-line">
                {COLS.map((c) => (
                  <td key={c.key} className="px-2 py-1.5">
                    <input value={r[c.key]} onChange={(e) => update(i, c.key, e.target.value)} type={c.key === "size" ? "text" : "number"} className="h-10 w-full rounded-lg border border-transparent bg-transparent px-2 outline-none hover:border-line focus:border-ink" aria-label={c.label} />
                  </td>
                ))}
                <td className="px-2"><button onClick={() => setChart((c) => c.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger" aria-label="حذف"><Icon name="trash" className="size-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => setChart((c) => [...c, { ...(c[c.length - 1] ?? { size: "50", lengthCm: 130, bustCm: 110, minHeight: 145, maxHeight: 150 }), size: String(Number(c[c.length - 1]?.size ?? 50) + 2) }])}
          className="flex w-full items-center justify-center gap-2 border-t border-line py-3 text-sm text-ink-2 hover:bg-sand"
        >
          <Icon name="plus" className="size-4" /> إضافة مقاس
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5 text-sm">
          <h2 className="mb-3 font-medium">قواعد الحساب</h2>
          <label className="mb-3 block">
            <span className="mb-1 block text-muted">نسبة طول العباية إلى طول الجسم</span>
            <input type="number" step="0.01" value={rules.heightToLengthRatio} onChange={(e) => setRules({ ...rules, heightToLengthRatio: Number(e.target.value) })} className="num h-10 w-full rounded-lg border border-line-2 px-3" />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-muted">إضافة للكعب (سم)</span>
            <input type="number" value={rules.heelAddCm} onChange={(e) => setRules({ ...rules, heelAddCm: Number(e.target.value) })} className="num h-10 w-full rounded-lg border border-line-2 px-3" />
          </label>
          <p className="mb-2 text-muted">تعديل الطول حسب القصة (سم)</p>
          <div className="grid grid-cols-2 gap-2">
            {cuts.map((c) => (
              <label key={c.code} className="flex items-center justify-between gap-2 rounded-lg bg-sand px-3 py-1.5">
                <span>{c.name}</span>
                <input type="number" value={rules.cutLengthAdjust[c.code] ?? 0} onChange={(e) => setRules({ ...rules, cutLengthAdjust: { ...rules.cutLengthAdjust, [c.code]: Number(e.target.value) } })} className="num h-8 w-16 rounded-md border border-line-2 bg-white px-2" />
              </label>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5 text-sm">
          <h2 className="mb-3 font-medium">جرّبي القواعد</h2>
          <label className="block text-muted">طول العميلة: <span className="num text-ink">{testH} سم</span></label>
          <input type="range" min={140} max={185} value={testH} onChange={(e) => setTestH(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-ink)]" />
          {test && (
            <div className="mt-4 rounded-xl bg-sand p-4 text-center">
              <p className="text-muted">قصة واسعة، بدون كعب</p>
              <p className="num font-display text-5xl font-semibold">{test.size}</p>
              <p className="num mt-1 text-xs text-muted">الطول المستهدف ≈ {test.targetLengthCm} سم</p>
            </div>
          )}
        </section>
      </div>
      <Button onClick={save} loading={saving} size="lg" className="w-full sm:w-auto">حفظ الجدول والقواعد</Button>
    </div>
  );
}
