"use client";

import { useEffect, useState } from "react";
import { announcement } from "@/content/site";
import { ArrowIcon, CloseIcon, SparkIcon } from "@/components/ui/Icons";

const KEY = "ar-announcement-dismissed";

export function AnnouncementBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(KEY) === announcement.text) setHidden(true);
    } catch {}
  }, []);

  if (!announcement.enabled || hidden) return null;

  return (
    <div className="relative bg-gradient-to-l from-deep via-[#5530c0] to-primary text-white">
      <div className="container-x flex min-h-11 items-center justify-center gap-3 py-2 pe-10 text-center text-sm">
        <SparkIcon className="hidden size-4 shrink-0 opacity-80 sm:block" />
        <p className="font-medium">{announcement.text}</p>
        <a
          href={announcement.href}
          className="group hidden items-center gap-1 font-semibold whitespace-nowrap underline-offset-4 hover:underline sm:inline-flex"
        >
          {announcement.linkLabel}
          <ArrowIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        </a>
      </div>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem(KEY, announcement.text);
          } catch {}
        }}
        className="absolute top-1/2 left-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
        aria-label="إخفاء الإعلان"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
