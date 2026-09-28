import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Soft, abstract 3D-looking shapes built with CSS gradients (no images). */

type ShapeProps = { className?: string; style?: CSSProperties; tone?: "purple" | "light" | "deep" };

const sphereTones = {
  purple: "radial-gradient(circle at 32% 28%, #d9ccff 0%, #9a74ff 28%, #7047eb 55%, #40218c 100%)",
  light: "radial-gradient(circle at 32% 28%, #ffffff 0%, #f2edff 35%, #cbb9ff 75%, #9a74ff 100%)",
  deep: "radial-gradient(circle at 32% 28%, #8f6bff 0%, #5a33c9 40%, #2a1463 100%)",
};

export function Sphere({ className, style, tone = "purple" }: ShapeProps) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none block rounded-full", className)}
      style={{
        background: sphereTones[tone],
        boxShadow: "inset -10px -14px 30px rgb(42 20 99 / 0.35), 0 30px 60px -20px rgb(64 33 140 / 0.45)",
        ...style,
      }}
    />
  );
}

export function Torus({ className, style, tone = "purple" }: ShapeProps) {
  const c = tone === "light" ? "#e6ddff" : tone === "deep" ? "#5a33c9" : "#8a66ff";
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none block rounded-full", className)}
      style={{
        maskImage: "radial-gradient(circle, transparent 38%, #000 39%, #000 62%, transparent 63%)",
        WebkitMaskImage: "radial-gradient(circle, transparent 38%, #000 39%, #000 62%, transparent 63%)",
        backgroundImage: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${c} 45%, #40218c 100%)`,
        ...style,
      }}
    />
  );
}

export function Capsule({ className, style, tone = "light" }: ShapeProps) {
  const bg =
    tone === "light"
      ? "linear-gradient(145deg, #ffffff 0%, #efe9ff 45%, #c6b3ff 100%)"
      : tone === "deep"
        ? "linear-gradient(145deg, #7b58f0 0%, #40218c 100%)"
        : "linear-gradient(145deg, #b69cff 0%, #7047eb 60%, #40218c 100%)";
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none block rounded-full", className)}
      style={{
        background: bg,
        boxShadow: "inset -6px -10px 24px rgb(64 33 140 / 0.25), 0 24px 50px -20px rgb(64 33 140 / 0.45)",
        ...style,
      }}
    />
  );
}

export function RoundedCube({ className, style, tone = "purple" }: ShapeProps) {
  const bg =
    tone === "light"
      ? "linear-gradient(135deg, #ffffff 0%, #ece5ff 50%, #bba6ff 100%)"
      : "linear-gradient(135deg, #a88bff 0%, #7047eb 50%, #40218c 100%)";
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none block rounded-[28%]", className)}
      style={{
        background: bg,
        boxShadow:
          "inset -8px -12px 26px rgb(42 20 99 / 0.3), inset 6px 8px 18px rgb(255 255 255 / 0.5), 0 30px 60px -25px rgb(64 33 140 / 0.5)",
        ...style,
      }}
    />
  );
}
