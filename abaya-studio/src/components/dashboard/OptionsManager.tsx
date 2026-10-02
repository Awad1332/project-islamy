"use client";

import { useMemo, useState } from "react";
import { defaultConfig, groupOptions } from "@/lib/engine/config";
import { formatSigned } from "@/lib/engine/pricing";
import { GROUP_META, GROUP_ORDER, type DesignConfig, type DesignOption, type OptionGroup, type StoreCatalog } from "@/lib/engine/types";
import type { Texture } from "@/lib/render/abaya";
import { renderInputFromConfig } from "@/lib/render/resolve";
import { AbayaArt, SwatchArt } from "../studio/Art";
import { Badge, Button, cx, Icon, Sheet, useToast } from "../ui";

const GROUP_TITLES: Record<OptionGroup, string> = {
  cut: "القصة",
  length: "الطول",
  sleeve: "الأكمام",
  neckline: "الرقبة",
  closure: "الإغلاق",
  fabric: "الخامة",
  color: "الألوان",
  embroidery: "التطريز",
  extra: "الإضافات",
};

const CROP: Partial<Record<OptionGroup, "full" | "sleeve" | "neck" | "torso">> = { cut: "full", sleeve: "sleeve", neckline: "neck", closure: "torso", embroidery: "torso", extra: "torso", length: "full" };

function Thumb({ catalog, o }: { catalog: StoreCatalog; o: DesignOption }) {
  const input = useMemo(() => {
    const base = defaultConfig(catalog);
    const cfg: DesignConfig = o.group === "extra" ? { ...base, extras: [o.code] } : { ...base, [o.group]: o.code };
    return renderInputFromConfig(catalog, cfg);
  }, [catalog, o]);
  // eslint-disable-next-line @next/next/no-img-element
  if (o.image) return <img src={o.image} alt="" className="h-full w-full object-cover" />;
  if (o.group === "color" || o.group === "fabric")
    return <SwatchArt colorHex={o.group === "color" ? (o.visual?.hex ?? "#141414") : "#2a2826"} sheen={o.visual?.sheen ?? 0.4} texture={(o.visual?.texture ?? "matte") as Texture} idPrefix={`mt-${o.id}`} className="h-full w-full" />;
  return <AbayaArt input={input} crop={CROP[o.group] ?? "full"} idPrefix={`mt-${o.group}-${o.code}`} className="h-full w-full" />;
}

type Draft = DesignOption & { isNew?: boolean };

export function OptionsManager({ initial }: { initial: StoreCatalog }) {
  const toast = useToast();
  const [catalog, setCatalog] = useState(initial);
  const [group, setGroup] = useState<OptionGroup>("cut");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ storeName: initial.storeName, basePrice: initial.basePrice, baseLeadTimeDays: initial.baseLeadTimeDays });

  const options = groupOptions(catalog, group);

  const saveSettings = async () => {
    const res = await fetch("/api/merchant/catalog", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return toast({ message: body.error ?? "تعذر الحفظ", tone: "danger" });
    setCatalog(body);
    toast({ message: "تم تحديث إعدادات التسعير", tone: "ok" });
  };

  const openNew = () =>
    setDraft({
      isNew: true,
      id: "",
      group,
      code: "",
      name: "",
      nameEn: "",
      description: "",
      price: 0,
      available: true,
      sku: "",
      leadTimeDays: 0,
      incompatibleWith: [],
      compatibleWith: [],
      sortOrder: options.length,
      visual: group === "color" ? { hex: "#2b2b2b", sheen: 0.4 } : group === "fabric" ? { texture: "matte" } : undefined,
    });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { isNew, id, group: g, ...rest } = draft;
    const payload = { ...rest, image: rest.image ?? "", ...(isNew ? { group: g } : {}) };
    if (!isNew) delete (payload as Partial<Draft>).code;
    const res = await fetch(isNew ? "/api/merchant/options" : `/api/merchant/options/${encodeURIComponent(id)}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return toast({ message: body.error ?? "تعذر الحفظ", tone: "danger" });
    // Reload catalog to reflect symmetric references.
    const fresh = await fetch("/api/merchant/catalog").then((r) => r.json());
    setCatalog(fresh);
    setDraft(null);
    toast({ message: isNew ? "تمت إضافة الخيار" : "تم حفظ الخيار", tone: "ok" });
  };

  const remove = async (o: DesignOption) => {
    if (!confirm(`حذف «${o.name}»؟`)) return;
    const res = await fetch(`/api/merchant/options/${encodeURIComponent(o.id)}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return toast({ message: body.error ?? "تعذر الحذف", tone: "danger" });
    setCatalog((c) => ({ ...c, options: c.options.filter((x) => x.id !== o.id) }));
    setDraft(null);
  };

  const toggleAvailable = async (o: DesignOption) => {
    const res = await fetch(`/api/merchant/options/${encodeURIComponent(o.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ available: !o.available }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return toast({ message: body.error ?? "تعذر التحديث", tone: "danger" });
    setCatalog((c) => ({ ...c, options: c.options.map((x) => (x.id === o.id ? body : x)) }));
  };

  /** Rules that reference this option from either side. */
  const ruleCount = (o: DesignOption) =>
    new Set([...o.incompatibleWith, ...o.compatibleWith, ...catalog.options.filter((x) => x.incompatibleWith.includes(o.id) || x.compatibleWith.includes(o.id)).map((x) => x.id)]).size;

  return (
    <div>
      <section className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-[1fr_160px_160px_auto] sm:items-end">
        <Field label="اسم المتجر"><input className="input" value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} /></Field>
        <Field label="السعر الأساسي (ريال)"><input type="number" className="input num" value={settings.basePrice} onChange={(e) => setSettings({ ...settings, basePrice: Number(e.target.value) })} /></Field>
        <Field label="مدة التنفيذ الأساسية (يوم)"><input type="number" className="input num" value={settings.baseLeadTimeDays} onChange={(e) => setSettings({ ...settings, baseLeadTimeDays: Number(e.target.value) })} /></Field>
        <Button onClick={saveSettings}>حفظ</Button>
      </section>

      <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto">
        {GROUP_ORDER.map((g) => (
          <button key={g} onClick={() => setGroup(g)} className={cx("h-9 shrink-0 rounded-full px-4 text-sm", g === group ? "bg-ink text-paper" : "bg-white ring-1 ring-line")}>
            {GROUP_TITLES[g]} <span className="num opacity-60">{catalog.options.filter((o) => o.group === g).length}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <ul className="divide-y divide-line">
          {options.map((o) => (
            <li key={o.id} className="flex items-center gap-3 p-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-sand"><Thumb catalog={catalog} o={o} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{o.name}</span>
                  {!o.available && <Badge tone="danger">غير متوفر</Badge>}
                  {ruleCount(o) > 0 && <Badge tone="gold">{ruleCount(o)} قواعد توافق</Badge>}
                </div>
                <p className="num mt-0.5 text-xs text-muted">
                  <span dir="ltr" className="font-mono">{o.sku}</span> · {o.price ? `${formatSigned(o.price)} ريال` : "ضمن السعر"} · {o.leadTimeDays ? `+${o.leadTimeDays} يوم تنفيذ` : "بدون مدة إضافية"}
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={o.available} onChange={() => toggleAvailable(o)} className="peer sr-only" />
                <span className="relative h-6 w-10 rounded-full bg-line-2 transition-colors after:absolute after:top-1 after:start-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-ink peer-checked:after:-translate-x-4" />
                <span className="hidden sm:inline">متوفر</span>
              </label>
              <Button size="sm" variant="secondary" onClick={() => setDraft({ ...o })}><Icon name="edit" className="size-4" /> تعديل</Button>
            </li>
          ))}
        </ul>
        <button onClick={openNew} className="flex w-full items-center justify-center gap-2 border-t border-line py-3.5 text-sm text-ink-2 hover:bg-sand">
          <Icon name="plus" className="size-4" /> إضافة خيار إلى «{GROUP_TITLES[group]}»
        </button>
      </div>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.isNew ? "خيار جديد" : `تعديل: ${draft?.name ?? ""}`} wide>
        {draft && <OptionForm catalog={catalog} draft={draft} setDraft={setDraft} />}
        {draft && (
          <div className="sticky -bottom-5 -mx-5 -mb-5 mt-6 flex gap-2 border-t border-line bg-paper px-5 pt-4 pb-5 sm:-bottom-7 sm:-mx-7 sm:-mb-7 sm:px-7 sm:pb-7">
            <Button className="flex-1" onClick={save} loading={saving} disabled={!draft.name || (draft.isNew && !/^[a-z0-9_]{1,40}$/.test(draft.code))}>حفظ</Button>
            {!draft.isNew && <Button variant="danger" onClick={() => remove(draft)}><Icon name="trash" className="size-4" /></Button>}
          </div>
        )}
      </Sheet>

      <style>{`.input{height:2.75rem;width:100%;border-radius:.75rem;border:1px solid var(--color-line-2);background:var(--color-paper);padding:0 .75rem;outline:none}.input:focus{border-color:var(--color-ink)}`}</style>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function OptionForm({ catalog, draft, setDraft }: { catalog: StoreCatalog; draft: Draft; setDraft: (d: Draft) => void }) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });
  const setVisual = (k: string, v: unknown) => setDraft({ ...draft, visual: { ...(draft.visual ?? {}), [k]: v } });
  const others = GROUP_ORDER.filter((g) => g !== draft.group || g === "extra");
  const [mode, setMode] = useState<"incompatibleWith" | "compatibleWith">("incompatibleWith");
  const list = draft[mode];
  const toggle = (id: string) => set(mode, list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const inbound = catalog.options.filter((o) => o.id !== draft.id && draft.id && o.incompatibleWith.includes(draft.id));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="الاسم"><input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="الاسم بالإنجليزية (لمحرك الصور)"><input className="input" dir="ltr" value={draft.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></Field>
        {draft.isNew && (
          <Field label="الرمز (code)" hint="حروف إنجليزية صغيرة وأرقام فقط"><input className="input font-mono" dir="ltr" value={draft.code} onChange={(e) => set("code", e.target.value.toLowerCase())} /></Field>
        )}
        <Field label="SKU"><input className="input font-mono" dir="ltr" value={draft.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} /></Field>
        <Field label="السعر الإضافي (ريال)"><input type="number" className="input num" value={draft.price} onChange={(e) => set("price", Number(e.target.value))} /></Field>
        <Field label="مدة تنفيذ إضافية (يوم)"><input type="number" className="input num" value={draft.leadTimeDays} onChange={(e) => set("leadTimeDays", Number(e.target.value))} /></Field>
      </div>
      <Field label="وصف قصير"><input className="input" value={draft.description} onChange={(e) => set("description", e.target.value)} maxLength={160} /></Field>
      <Field label="رابط الصورة" hint="اتركيه فارغًا لاستخدام الرسم التوضيحي التلقائي"><input className="input" dir="ltr" value={draft.image ?? ""} onChange={(e) => set("image", e.target.value)} placeholder="https://" /></Field>
      <Field label="وصف إنجليزي لمحرك الصور (اختياري)"><input className="input" dir="ltr" value={draft.prompt ?? ""} onChange={(e) => set("prompt", e.target.value)} /></Field>

      {draft.group === "color" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="درجة اللون"><input type="color" className="input p-1" value={draft.visual?.hex ?? "#222222"} onChange={(e) => setVisual("hex", e.target.value)} /></Field>
          <Field label="اللمعة"><input type="range" min={0} max={1} step={0.05} value={draft.visual?.sheen ?? 0.4} onChange={(e) => setVisual("sheen", Number(e.target.value))} className="w-full accent-[var(--color-ink)]" /></Field>
        </div>
      )}
      {draft.group === "fabric" && (
        <Field label="ملمس العرض">
          <select className="input" value={draft.visual?.texture ?? "matte"} onChange={(e) => setVisual("texture", e.target.value)}>
            <option value="matte">مطفي</option><option value="soft">ناعم</option><option value="satin">لامع</option><option value="linen">منسوج</option><option value="sheer">شفاف بطبقتين</option>
          </select>
        </Field>
      )}
      {draft.group === "embroidery" && (
        <Field label="لون الخيط"><input type="color" className="input p-1" value={draft.visual?.thread ?? "#c9a45c"} onChange={(e) => setVisual("thread", e.target.value)} /></Field>
      )}
      {draft.group === "length" && (
        <Field label="الطول بالسنتيمتر"><input type="number" className="input num" value={draft.visual?.cm ?? ""} onChange={(e) => setVisual("cm", Number(e.target.value))} /></Field>
      )}
      {["cut", "sleeve", "neckline", "closure", "extra"].includes(draft.group) && (
        <Field label="يُعرض في المعاينة مثل" hint="لخيار جديد: اختاري أقرب شكل موجود للمعاينة">
          <select className="input" value={draft.visual?.renderAs ?? ""} onChange={(e) => setVisual("renderAs", e.target.value || undefined)}>
            <option value="">— نفس الرمز —</option>
            {groupOptions(catalog, draft.group).filter((o) => o.id !== draft.id).map((o) => <option key={o.id} value={o.code}>{o.name}</option>)}
          </select>
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.available} onChange={(e) => set("available", e.target.checked)} className="size-4 accent-[var(--color-ink)]" /> متوفر للعميلات
      </label>

      <div className="rounded-2xl border border-line bg-white p-4">
        <p className="font-medium">التوافق</p>
        <p className="mt-0.5 text-xs text-muted">يُطبّق في الاتجاهين تلقائيًا. «متوافق فقط مع» يحصر المجموعة المختارة في الخيارات المحددة.</p>
        <div className="mt-3 flex rounded-full bg-sand p-1 text-sm">
          {(["incompatibleWith", "compatibleWith"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cx("flex-1 rounded-full py-1.5", mode === m ? "bg-white shadow-sm" : "text-muted")}>
              {m === "incompatibleWith" ? `غير متوافق مع (${draft.incompatibleWith.length})` : `متوافق فقط مع (${draft.compatibleWith.length})`}
            </button>
          ))}
        </div>
        <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
          {others.map((g) => {
            const opts = groupOptions(catalog, g).filter((o) => o.id !== draft.id);
            if (!opts.length) return null;
            return (
              <div key={g}>
                <p className="mb-1.5 text-xs text-muted">{GROUP_META[g].label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {opts.map((o) => (
                    <button key={o.id} onClick={() => toggle(o.id)} className={cx("rounded-full border px-3 py-1 text-xs", list.includes(o.id) ? (mode === "incompatibleWith" ? "border-danger bg-danger-soft text-danger" : "border-ok bg-ok-soft text-ok") : "border-line-2")}>
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {inbound.length > 0 && (
          <p className="mt-3 text-xs text-muted">مُعرّف أيضًا كغير متوافق من: {inbound.map((o) => o.name).join("، ")}</p>
        )}
      </div>
    </div>
  );
}
