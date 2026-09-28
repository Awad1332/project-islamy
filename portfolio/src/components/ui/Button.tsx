import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "white" | "outlineWhite";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[0_10px_30px_-10px_rgb(112_71_235/0.7)] hover:bg-primary-600 hover:shadow-[0_14px_34px_-10px_rgb(112_71_235/0.8)]",
  secondary: "bg-white text-ink ring-1 ring-line hover:ring-primary/40 hover:text-primary shadow-soft",
  ghost: "text-ink hover:bg-lilac hover:text-primary",
  white: "bg-white text-deep hover:bg-lilac shadow-[0_10px_30px_-10px_rgb(0_0_0/0.35)]",
  outlineWhite: "text-white ring-1 ring-white/35 hover:bg-white/10 hover:ring-white/60",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-14 px-7 text-base sm:text-lg",
};

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

export function Button({ variant = "primary", size = "md", icon, className, children, ...rest }: Props) {
  return (
    <a
      className={cn(
        "group inline-flex items-center justify-center gap-2.5 rounded-full font-semibold whitespace-nowrap transition-all duration-300 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
      {icon}
    </a>
  );
}
