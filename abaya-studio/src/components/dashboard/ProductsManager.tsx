"use client";

import Link from "next/link";
import { useState } from "react";
import { formatSAR } from "@/lib/engine/pricing";
import { GROUP_META, type OptionGroup } from "@/lib/engine/types";
import type { ProductTemplate } from "@/lib/models";
import { Badge, Button, Icon, useToast } from "../ui";

export function ProductsManager({ initial }: { initial: ProductTemplate[] }) {
  const [items, setItems] = useState(initial);
  const toast = useToast();

  const patch = async (id: string, data: Partial<ProductTemplate>) => {
    const res = await fetch(`/api/merchant/products/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return toast({ message: body.error ?? "تعذر الحفظ", tone: "danger" });
    setItems((all) => all.map((p) => (p.id === id ? body : p)));
    toast({ message: "تم الحفظ", tone: "ok" });
  };
  const remove = async (id: string) => {
    if (!confirm("حذف قالب المنتج؟")) return;
    const res = await fetch(`/api/merchant/products/${id}`, { method: "DELETE" });
    if (res.ok) setItems((all) => all.filter((p) => p.id !== id));
  };

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line-2 p-12 text-center">
        <Icon name="box" className="mx-auto mb-3 size-8 text-muted" />
        <p className="font-medium">لا توجد قوالب منتجات بعد</p>
        <p className="mt-1 text-sm text-muted">اختاري تصميمًا ناجحًا من «التصميمات» أو تركيبة من «Trend Lab» واضغطي «حوّل إلى منتج».</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/dashboard/designs" className="rounded-xl bg-ink px-5 py-3 text-sm text-paper">التصميمات</Link>
          <Link href="/dashboard/trends" className="rounded-xl border border-line-2 bg-white px-5 py-3 text-sm">Trend Lab</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} onSave={(d) => patch(p.id, d)} onDelete={() => remove(p.id)} />
      ))}
    </div>
  );
}

function ProductCard({ p, onSave, onDelete }: { p: ProductTemplate; onSave: (d: Partial<ProductTemplate>) => void; onDelete: () => void }) {
  const [name, setName] = useState(p.name);
  const [price, setPrice] = useState(p.price);
  const dirty = name !== p.name || price !== p.price;
  return (
    <article id={p.id} className="grid gap-5 rounded-2xl border border-line bg-white p-4 md:grid-cols-[180px_1fr] lg:p-5">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {p.images.slice(0, 2).map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="aspect-[3/4] w-full rounded-xl bg-sand object-cover object-top" loading="lazy" />
        ))}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={p.status === "published" ? "ok" : "neutral"}>{p.status === "published" ? "منشور" : "مسودة"}</Badge>
          <span className="num text-xs text-muted" dir="ltr">من التصميم #{p.sourceDesignCode}</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
          <label className="text-sm">
            <span className="mb-1 block text-muted">اسم المنتج</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-xl border border-line-2 bg-paper px-3 outline-none focus:border-ink" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">السعر (ريال)</span>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="num h-11 w-full rounded-xl border border-line-2 bg-paper px-3 outline-none focus:border-ink" />
          </label>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">SKU</dt><dd className="num truncate font-mono text-xs" dir="ltr">{p.sku}</dd></div>
          <div><dt className="text-muted">المقاسات</dt><dd className="num">{p.sizes.join(" · ")}</dd></div>
          <div><dt className="text-muted">مدة التنفيذ</dt><dd>{p.leadTimeDays} أيام</dd></div>
        </dl>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted">المكونات ({p.components.length})</summary>
          <table className="mt-2 w-full">
            <tbody>
              {p.components.map((c) => (
                <tr key={c.optionId} className="border-t border-line">
                  <td className="py-1.5 text-muted">{GROUP_META[c.group as OptionGroup]?.label}</td>
                  <td>{c.name}</td>
                  <td className="num font-mono text-xs" dir="ltr">{c.sku}</td>
                  <td className="num text-end">{c.price ? `+${c.price}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={!dirty} onClick={() => onSave({ name, price })}>حفظ التعديلات</Button>
          <Button size="sm" variant="secondary" onClick={() => onSave({ status: p.status === "published" ? "draft" : "published" })}>
            {p.status === "published" ? "إلغاء النشر" : "نشر في المتجر"}
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}><Icon name="trash" className="size-4" /> حذف</Button>
          <span className="num ms-auto self-center text-sm text-muted">السعر المحسوب: {formatSAR(p.price)}</span>
        </div>
      </div>
    </article>
  );
}
