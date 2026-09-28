import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "start";
  id?: string;
  tone?: "light" | "dark";
  className?: string;
};

export function SectionHeading({ eyebrow, title, subtitle, align = "center", id, tone = "light", className }: Props) {
  const dark = tone === "dark";
  return (
    <Reveal as="header" className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-start", className)}>
      {eyebrow && (
        <p
          className={cn(
            "mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold",
            dark ? "bg-white/10 text-white/90" : "bg-lilac text-primary",
          )}
        >
          <span aria-hidden className={cn("size-1.5 rounded-full", dark ? "bg-white" : "bg-primary")} />
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={cn(
          "text-[2rem] leading-[1.25] font-bold tracking-tight sm:text-4xl lg:text-[2.9rem] lg:leading-[1.2]",
          dark ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn("mt-5 text-lg leading-8 sm:text-xl sm:leading-9", dark ? "text-white/75" : "text-muted")}>{subtitle}</p>
      )}
    </Reveal>
  );
}
