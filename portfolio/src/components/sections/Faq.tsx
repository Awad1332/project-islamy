"use client";

import { useState } from "react";
import { faq, whatsappLink } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlusIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="section-y">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="faq-title"
            eyebrow={faq.eyebrow}
            title={faq.title}
            subtitle={faq.subtitle}
            align="start"
            className="max-lg:mx-auto max-lg:text-center"
          />
          <Reveal className="mt-8 flex justify-center lg:justify-start">
            <a
              href={whatsappLink("مرحبًا عوض، لدي سؤال بخصوص خدماتك.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-lilac px-5 py-3 font-semibold text-primary transition hover:bg-primary hover:text-white"
            >
              <WhatsAppIcon className="size-5" />
              اسألني مباشرة
            </a>
          </Reveal>
        </div>

        <Reveal>
          <ul className="grid gap-3">
            {faq.items.map((item, i) => {
              const isOpen = open === i;
              return (
                <li
                  key={item.q}
                  className={cn(
                    "rounded-[1.5rem] border transition-all duration-300",
                    isOpen ? "border-primary/25 bg-white shadow-card" : "border-line bg-alt/60 hover:bg-alt",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      id={`faq-q-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-a-${i}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] px-6 py-5 text-start text-lg font-semibold text-ink sm:px-7"
                    >
                      {item.q}
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full transition-all duration-300",
                          isOpen ? "rotate-45 bg-primary text-white" : "bg-white text-primary ring-1 ring-line",
                        )}
                      >
                        <PlusIcon className="size-4.5" />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-a-${i}`}
                    role="region"
                    aria-labelledby={`faq-q-${i}`}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                    inert={!isOpen}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-[1.05rem] leading-8 text-muted sm:px-7">{item.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
