"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { evaluateGroup, optionFor, type OptionState } from "@/lib/engine/config";
import { formatSigned } from "@/lib/engine/pricing";
import type { DesignConfig, DesignOption, OptionGroup, StoreCatalog } from "@/lib/engine/types";
import type { Crop, Texture } from "@/lib/render/abaya";
import { renderInputFromConfig } from "@/lib/render/resolve";
import { AbayaArt, SwatchArt } from "./Art";
import { cx, Icon } from "../ui";

const EXTRA_CROP: Record<string, Crop> = {
  belt: "waist",
  pockets: "torso",
  cuffs: "sleeve",
  sleeve_detail: "sleeve",
  hem_trim: "hem",
};

function previewConfig(config: DesignConfig, o: DesignOption): DesignConfig {
  if (o.group === "extra") return { ...config, extras: config.extras.includes(o.code) ? config.extras : [...config.extras, o.code] };
  return { ...config, [o.group]: o.code };
}

function OptionVisual({ catalog, config, state, art, crop }: { catalog: StoreCatalog; config: DesignConfig; state: OptionState; art: string; crop?: Crop }) {
  const o = state.option;
  const input = useMemo(() => renderInputFromConfig(catalog, previewConfig(config, o)), [catalog, config, o]);
  if (o.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={o.image} alt="" className="h-full w-full object-cover" loading="lazy" />;
  }
  if (art === "swatch") {
    const color = o.group === "color" ? o.visual : optionFor(catalog, "color", config.color)?.visual;
    const fabric = o.group === "fabric" ? o.visual : optionFor(catalog, "fabric", config.fabric)?.visual;
    return (
      <SwatchArt
        colorHex={color?.hex ?? "#141414"}
        sheen={color?.sheen ?? 0.4}
        texture={(fabric?.texture ?? "matte") as Texture}
        idPrefix={`sw-${o.group}-${o.code}`}
        className="h-full w-full"
      />
    );
  }
  const c: Crop = o.group === "extra" ? (EXTRA_CROP[o.code] ?? "torso") : o.group === "embroidery" ? "torso" : (crop ?? "full");
  return <AbayaArt input={input} crop={c} idPrefix={`op-${o.group}-${o.code}`} className="h-full w-full" />;
}

export function OptionGrid({
  catalog,
  config,
  group,
  art,
  crop,
  onSelect,
  columns = 2,
}: {
  catalog: StoreCatalog;
  config: DesignConfig;
  group: OptionGroup;
  art: "figure" | "swatch" | "length" | "chip";
  crop?: Crop;
  onSelect: (group: OptionGroup, code: string) => void;
  columns?: 2 | 3;
}) {
  const states = useMemo(() => evaluateGroup(catalog, config, group), [catalog, config, group]);
  const [notice, setNotice] = useState<OptionState | null>(null);
  const [onlyCompatible, setOnlyCompatible] = useState(false);
  const hiddenCount = states.filter((s) => s.status !== "available").length;
  const visible = onlyCompatible ? states.filter((s) => s.status === "available") : states;

  const click = (s: OptionState) => {
    if (s.status !== "available") {
      setNotice(s);
      return;
    }
    setNotice(null);
    onSelect(group, s.option.code);
  };

  if (art === "length") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {states.map((s) => (
          <button
            key={s.option.id}
            onClick={() => click(s)}
            aria-pressed={s.selected}
            className={cx(
              "num flex h-16 flex-col items-center justify-center rounded-xl border text-sm transition-all duration-200 active:scale-[0.97]",
              s.selected ? "border-ink bg-ink text-paper" : "border-line-2 bg-white hover:border-ink",
              s.status !== "available" && "opacity-40",
            )}
          >
            <span className="text-lg font-medium leading-none">{s.option.visual?.cm ?? s.option.code}</span>
            <span className={cx("mt-1 text-[11px]", s.selected ? "text-paper/70" : "text-muted")}>سم</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      {notice &&
        typeof document !== "undefined" &&
        // Portaled: animated ancestors would otherwise become the containing block for `fixed`.
        createPortal(
          <div
            role="alert"
            className="animate-fade-in fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[65] rounded-xl border border-danger/20 bg-danger-soft p-3.5 text-sm text-danger shadow-lg shadow-black/10 lg:inset-x-auto lg:end-8 lg:bottom-8 lg:w-[420px]"
          >
            <div className="flex items-start gap-2">
              <Icon name="info" className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1">{notice.reason}</p>
              <button onClick={() => setNotice(null)} aria-label="إغلاق">
                <Icon name="x" className="size-4" />
              </button>
            </div>
            {notice.status === "incompatible" && (
              <button
                className="mt-2 ms-6 font-semibold underline underline-offset-4"
                onClick={() => {
                  setOnlyCompatible(true);
                  setNotice(null);
                }}
              >
                شاهدي الخيارات المتوافقة
              </button>
            )}
          </div>,
          document.body,
        )}
      {onlyCompatible && hiddenCount > 0 && (
        <button onClick={() => setOnlyCompatible(false)} className="mb-3 text-sm text-muted underline underline-offset-4">
          عرض كل الخيارات ({hiddenCount} مخفية)
        </button>
      )}
      <div className={cx("grid gap-3", columns === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
        {visible.map((s) => {
          const o = s.option;
          const blocked = s.status !== "available";
          return (
            <button
              key={o.id}
              onClick={() => click(s)}
              aria-pressed={s.selected}
              aria-disabled={blocked}
              className={cx(
                "group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-start transition-all duration-300 ease-[var(--ease-lux)]",
                s.selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)] animate-pop" : "border-line hover:border-line-2 hover:shadow-md hover:shadow-black/5",
                blocked && "cursor-not-allowed",
              )}
            >
              <div className={cx("relative overflow-hidden bg-[#f3eee7]", art === "swatch" ? "aspect-[4/3]" : group === "cut" ? "aspect-[3/4]" : "aspect-square")}>
                <div className={cx("h-full w-full transition-transform duration-500 group-hover:scale-[1.03]", blocked && "opacity-40 grayscale")}>
                  <OptionVisual catalog={catalog} config={config} state={s} art={art} crop={crop} />
                </div>
                {s.selected && (
                  <span className="absolute top-2 start-2 grid size-6 place-items-center rounded-full bg-ink text-paper">
                    <Icon name="check" className="size-3.5" strokeWidth={2.2} />
                  </span>
                )}
                {s.status === "unavailable" && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 py-1 text-center text-[11px] text-ink-2">غير متوفر حاليًا</span>}
                {s.status === "incompatible" && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 py-1 text-center text-[11px] text-danger">غير متوافق</span>}
              </div>
              <div className="flex flex-1 flex-col gap-0.5 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{o.name}</span>
                  {o.price !== 0 && <span className="num shrink-0 text-xs text-gold">{formatSigned(o.price)} ريال</span>}
                </div>
                {o.description && <span className="text-xs leading-relaxed text-muted">{o.description}</span>}
                {s.status === "available" && s.willReplace.length > 0 && !s.selected && (
                  <span className="mt-1 text-[11px] text-plum">سيتم تعديل: {s.willReplace.map((w) => w.name).join("، ")}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
