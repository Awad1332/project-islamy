"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DesignConfig } from "@/lib/engine/types";
import { Button, Icon, useToast } from "../ui";

export function ConvertButton({ designCode, config, label = "حوّل إلى منتج", size = "sm", variant = "secondary" }: { designCode?: string; config?: DesignConfig; label?: string; size?: "sm" | "md"; variant?: "primary" | "secondary" }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const run = async () => {
    setBusy(true);
    const res = await fetch("/api/merchant/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(designCode ? { designCode } : { config }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast({ message: body.error ?? "تعذر الإنشاء", tone: "danger" });
    toast({ message: `تم إنشاء قالب المنتج: ${body.name}`, tone: "ok", action: { label: "فتح", onClick: () => router.push(`/dashboard/products#${body.id}`) } });
  };
  return (
    <Button size={size} variant={variant} onClick={run} loading={busy}>
      <Icon name="box" className="size-4" /> {label}
    </Button>
  );
}
