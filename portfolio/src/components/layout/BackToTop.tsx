"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ArrowUpIcon } from "@/components/ui/Icons";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="العودة إلى أعلى الصفحة"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        document.getElementById("home")?.focus({ preventScroll: true });
      }}
      className={cn(
        "fixed bottom-5 left-5 z-40 grid size-12 place-items-center rounded-full bg-white text-primary shadow-float ring-1 ring-line transition-all duration-300 hover:bg-primary hover:text-white sm:bottom-8 sm:left-8",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
      tabIndex={show ? 0 : -1}
    >
      <ArrowUpIcon className="size-5" />
    </button>
  );
}
