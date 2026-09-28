"use client";

import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/content/site";
import { cn } from "@/lib/cn";
import { ArrowIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { Logo } from "./Logo";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Glass surface on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the nav link of the section in view
  useEffect(() => {
    const sections = nav.map((n) => document.querySelector<HTMLElement>(n.href)).filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Mobile menu: lock scroll, close on Escape, move focus
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("a,button");
        const f = items[0];
        const l = items[items.length - 1];
        if (e.shiftKey && document.activeElement === f) {
          e.preventDefault();
          l.focus();
        } else if (!e.shiftKey && document.activeElement === l) {
          e.preventDefault();
          f.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "glass border-b border-line/80 shadow-[0_6px_24px_-16px_rgb(25_21_43/0.25)]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-x flex h-[72px] items-center justify-between gap-6 lg:h-20">
        <Logo />

        <nav aria-label="القائمة الرئيسية" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={active === item.href ? "true" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors",
                    active === item.href ? "text-primary" : "text-ink/75 hover:text-ink",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-4 -bottom-0.5 h-0.5 origin-center rounded-full bg-primary transition-transform duration-300",
                      active === item.href ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="group hidden h-11 items-center gap-2 rounded-full bg-primary px-5 text-[0.95rem] font-semibold text-white shadow-[0_10px_30px_-12px_rgb(112_71_235/0.8)] transition-all hover:bg-primary-600 sm:inline-flex"
          >
            لنبدأ مشروعك
            <ArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="grid size-11 place-items-center rounded-full text-ink ring-1 ring-line transition hover:bg-lilac lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-white lg:hidden"
      >
        <nav aria-label="قائمة الجوال" className="container-x py-4">
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-medium transition-colors",
                    active === item.href ? "bg-lilac text-primary" : "text-ink hover:bg-alt",
                  )}
                >
                  {item.label}
                  <ArrowIcon className="size-4 opacity-40" />
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-4 flex h-13 items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-semibold text-white"
          >
            لنبدأ مشروعك
            <ArrowIcon className="size-4" />
          </a>
          <p className="mt-4 text-center text-sm text-muted">{site.descriptor}</p>
        </nav>
      </div>
    </header>
  );
}
