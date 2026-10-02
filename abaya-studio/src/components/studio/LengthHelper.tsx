"use client";

import { useState } from "react";
import { recommendLength, type HeelHabit, type LengthPreference } from "@/lib/engine/size";
import type { StoreCatalog } from "@/lib/engine/types";
import { Button, Chip } from "../ui";

export function LengthHelper({ catalog, lengths, cut, onApply }: { catalog: StoreCatalog; lengths: number[]; cut: string; onApply: (cm: number) => void }) {
  const [height, setHeight] = useState(160);
  const [heels, setHeels] = useState<HeelHabit>("never");
  const [pref, setPref] = useState<LengthPreference>("standard");
  const rec = recommendLength(catalog, lengths, { heightCm: height, heels, preference: pref, cut });
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm text-muted">طولك</label>
        <div className="flex items-center gap-3">
          <input type="range" min={140} max={185} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="flex-1 accent-[var(--color-ink)]" aria-label="طولك" />
          <span className="num w-16 text-end font-display text-2xl">{height}<span className="text-sm text-muted"> سم</span></span>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm text-muted">هل تلبسين كعب؟</label>
        <div className="grid grid-cols-3 gap-2">
          <Chip active={heels === "always"} onClick={() => setHeels("always")}>غالبًا</Chip>
          <Chip active={heels === "sometimes"} onClick={() => setHeels("sometimes")}>أحيانًا</Chip>
          <Chip active={heels === "never"} onClick={() => setHeels("never")}>لا</Chip>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm text-muted">تفضيلك</label>
        <div className="grid grid-cols-3 gap-2">
          <Chip active={pref === "shorter"} onClick={() => setPref("shorter")}>أقصر قليلًا</Chip>
          <Chip active={pref === "standard"} onClick={() => setPref("standard")}>قياسي</Chip>
          <Chip active={pref === "floor"} onClick={() => setPref("floor")}>يلامس الأرض</Chip>
        </div>
      </div>
      <div className="rounded-2xl bg-sand p-4 text-center">
        <p className="text-sm text-muted">الطول المقترح</p>
        <p className="num font-display text-4xl font-semibold">{rec.lengthCm} سم</p>
        <p className="mt-1 text-xs text-muted">{rec.reason}</p>
      </div>
      <Button className="w-full" onClick={() => onApply(rec.lengthCm)}>اعتمدي {rec.lengthCm} سم</Button>
    </div>
  );
}
