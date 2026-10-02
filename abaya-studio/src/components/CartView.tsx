"use client";

import Link from "next/link";
import { useState } from "react";
import { formatSAR } from "@/lib/engine/pricing";
import type { CartItem } from "@/lib/models";
import { Button, Icon, Logo, useToast } from "./ui";

type Item = CartItem & { title: string; image: string };

export function CartView({ items: initial }: { items: Item[] }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<{ number: string; total: number } | null>(null);
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const remove = async (id: string) => {
    const res = await fetch(`/api/cart?item=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setItems((all) => all.filter((i) => i.id !== id));
    else toast({ message: "تعذر الحذف", tone: "danger" });
  };

  const checkout = async () => {
    setBusy(true);
    const res = await fetch("/api/cart/checkout", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast({ message: body.error ?? "تعذر إتمام الطلب", tone: "danger" });
    setOrder(body);
    setItems([]);
  };

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Logo />
          <Link href="/studio" className="text-sm text-ink-2 underline underline-offset-4">صممي عباية جديدة</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 font-display text-3xl font-semibold">السلة</h1>
        {order ? (
          <div className="animate-fade-in rounded-3xl border border-line bg-white p-8 text-center">
            <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-ok-soft text-ok"><Icon name="check" className="size-7" /></span>
            <p className="font-display text-2xl font-semibold">تم استلام طلبك</p>
            <p className="num mt-1 text-muted">رقم الطلب #{order.number} · {formatSAR(order.total)}</p>
            <p className="mt-3 text-sm text-muted">سيتواصل معك المتجر لتأكيد التفاصيل وموعد التسليم.</p>
            <Link href="/studio" className="mt-6 inline-block text-sm underline underline-offset-4">صممي عباية أخرى</Link>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line-2 p-10 text-center">
            <Icon name="bag" className="mx-auto mb-3 size-8 text-muted" />
            <p className="font-medium">سلتك فارغة</p>
            <p className="mt-1 text-sm text-muted">صممي عبايتك الأولى وأضيفيها هنا.</p>
            <Link href="/studio" className="mt-5 inline-flex h-12 items-center rounded-xl bg-ink px-6 text-paper">ابدئي التصميم</Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4 rounded-2xl border border-line bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image} alt="" className="h-28 w-20 rounded-xl bg-sand object-cover" />
                  <div className="flex flex-1 flex-col">
                    <p className="font-medium">{i.title}</p>
                    <p className="num text-sm text-muted" dir="ltr">#{i.designCode}</p>
                    <p className="num mt-1 text-sm text-muted">المقاس {i.size} · الكمية {i.quantity}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="num font-semibold">{formatSAR(i.unitPrice * i.quantity)}</span>
                      <div className="flex gap-3 text-sm">
                        <Link href={`/d/${i.designCode}`} className="text-muted underline underline-offset-4">عرض</Link>
                        <button onClick={() => remove(i.id)} className="text-danger">حذف</button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-line bg-white p-5">
              <div className="num flex justify-between text-lg font-semibold"><span>الإجمالي</span><span>{formatSAR(total)}</span></div>
              <Button size="lg" className="mt-4 w-full" onClick={checkout} loading={busy}>إتمام الطلب</Button>
              <p className="mt-2 text-center text-xs text-muted">نموذج تجريبي — الدفع يتم عبر منصة المتجر عند الربط (سلة / شوبيفاي).</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
