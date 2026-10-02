"use client";

import { memo, useMemo } from "react";
import { renderAbayaSvg, renderSwatchSvg, type Crop, type RenderInput, type RenderView, type Texture } from "@/lib/render/abaya";
import { cx } from "../ui";

/** Inline SVG from our own renderer (inputs are numbers and validated hex only). */
export const AbayaArt = memo(function AbayaArt({
  input,
  view = "front",
  crop = "full",
  mode = "bare",
  idPrefix,
  className,
  title,
}: {
  input: RenderInput;
  view?: RenderView;
  crop?: Crop;
  mode?: "studio" | "photo" | "bare";
  idPrefix: string;
  className?: string;
  title?: string;
}) {
  const svg = useMemo(() => renderAbayaSvg(input, { view, crop, mode, idPrefix, title }), [input, view, crop, mode, idPrefix, title]);
  return <div className={cx("svg-fill", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
});

export const SwatchArt = memo(function SwatchArt({
  colorHex,
  sheen,
  texture,
  idPrefix,
  className,
}: {
  colorHex: string;
  sheen: number;
  texture: Texture;
  idPrefix: string;
  className?: string;
}) {
  const svg = useMemo(() => renderSwatchSvg({ colorHex, sheen, texture }, idPrefix), [colorHex, sheen, texture, idPrefix]);
  return <div className={cx("svg-fill", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
});
