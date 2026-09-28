"use client";

import { useEffect, useRef, useState } from "react";
import { testimonials } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";
import { ArrowIcon, ArrowRightIcon, ExternalIcon, QuoteIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

export function Testimonials() {
  const items = testimonials.items;
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Track which card is at the reading start of the scroller
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const pos = Math.abs(track.scrollLeft); // RTL scrollLeft is ≤ 0
      setAtStart(pos < 4);
      setAtEnd(pos > max - 4);
      const cards = Array.from(track.children) as HTMLElement[];
      const trackRight = track.getBoundingClientRect().right - parseFloat(getComputedStyle(track).paddingRight);
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().right - trackRight);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setIndex(best);
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    const card = track.children[clamped] as HTMLElement | undefined;
    if (!card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Align the card's right (start) edge with the track's right edge.
    const start = track.getBoundingClientRect().right - parseFloat(getComputedStyle(track).paddingRight);
    const delta = card.getBoundingClientRect().right - start;
    track.scrollBy({ left: delta, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="overflow-hidden section-y">
      <div className="container-x">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="testimonials-title"
            eyebrow={testimonials.eyebrow}
            title={testimonials.title}
            subtitle={testimonials.subtitle}
            align="start"
            className="max-lg:text-center"
          />
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={atStart}
              aria-label="الرأي السابق"
              aria-controls="testimonials-track"
              className="grid size-12 place-items-center rounded-full bg-white text-ink ring-1 ring-line transition hover:bg-primary hover:text-white hover:ring-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowRightIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={atEnd}
              aria-label="الرأي التالي"
              aria-controls="testimonials-track"
              className="grid size-12 place-items-center rounded-full bg-white text-ink ring-1 ring-line transition hover:bg-primary hover:text-white hover:ring-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowIcon className="size-5" />
            </button>
          </div>
        </div>

        <Reveal className="mt-12">
          <ul
            id="testimonials-track"
            ref={trackRef}
            aria-roledescription="carousel"
            aria-label="آراء العملاء"
            className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-6 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
          >
            {items.map((t, i) => (
              <li
                key={i}
                aria-roledescription="slide"
                aria-label={`${i + 1} من ${items.length}`}
                className="w-[86%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc((100%-40px)/3)]"
              >
                <figure className="flex h-full flex-col rounded-[2rem] border border-line bg-white p-7 transition-all duration-300 hover:border-primary/25 hover:shadow-card sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <QuoteIcon className="size-10 text-primary/20" />
                    <PlaceholderBadge show={Boolean(t.isPlaceholder)} label="نموذج — يُستبدل برأي حقيقي" />
                  </div>
                  <blockquote className="mt-5 flex-1 text-lg leading-8 text-ink">{t.quote}</blockquote>
                  <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-6">
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lilac to-lilac-2 text-lg font-bold text-primary"
                    >
                      {t.name.charAt(0)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-bold text-ink">{t.name}</span>
                      <span className="text-sm text-muted">{t.category}</span>
                    </span>
                    {t.url && (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`زيارة متجر ${t.name}`}
                        className="grid size-9 place-items-center rounded-full bg-alt text-primary ring-1 ring-line"
                      >
                        <ExternalIcon className="size-4" />
                      </a>
                    )}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-2 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`الانتقال إلى الرأي ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className="grid h-6 place-items-center px-0.5"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-300",
                  i === index ? "w-7 bg-primary" : "w-2 bg-line hover:bg-primary/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
