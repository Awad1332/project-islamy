import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

/** Arrow pointing in the reading direction (left in RTL). */
export const ArrowIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const ArrowRightIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowUpIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M10 17h10" />
  </svg>
);
export const SparkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" />
  </svg>
);
export const PaletteIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 100 18c1.1 0 1.6-.9 1.2-1.8-.6-1.3.2-2.7 1.6-2.7H17a4 4 0 004-4c0-5-4-9.5-9-9.5z" />
    <circle cx="7.5" cy="11" r="1.2" />
    <circle cx="10" cy="7" r="1.2" />
    <circle cx="15" cy="7.5" r="1.2" />
  </svg>
);
export const CursorIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3l14 7-6 1.8L10.5 18 5 3z" />
  </svg>
);
export const FlowIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="6" height="6" rx="1.5" />
    <rect x="15" y="14" width="6" height="6" rx="1.5" />
    <path d="M9 7h4a3 3 0 013 3v4" />
  </svg>
);
export const DevicesIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="5" width="14" height="10" rx="1.5" />
    <path d="M6 19h6" />
    <rect x="17" y="8" width="5" height="11" rx="1.2" />
  </svg>
);
export const QuoteIcon = (p: P) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden {...p}>
    <path d="M13.5 8C8.3 9.6 5 13.6 5 19v5.5A2.5 2.5 0 007.5 27h5a2.5 2.5 0 002.5-2.5v-5A2.5 2.5 0 0012.5 17H9.6c.5-3 2.5-5.1 5.2-6.2L13.5 8zm14 0c-5.2 1.6-8.5 5.6-8.5 11v5.5a2.5 2.5 0 002.5 2.5h5a2.5 2.5 0 002.5-2.5v-5a2.5 2.5 0 00-2.5-2.5h-2.9c.5-3 2.5-5.1 5.2-6.2L27.5 8z" />
  </svg>
);
export const ExternalIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
  </svg>
);

/* ── Social ── */
export const WhatsAppIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20l1.2-3.9A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.1-1.1L4 20z" />
    <path
      d="M9 8.6c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.7l-.5.6c.6 1.2 1.6 2.2 2.8 2.8l.6-.5c.2-.2.5-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.2.6-.5.8-.6.4-1.4.5-2.2.2-2.4-.8-4.3-2.7-5.1-5.1-.3-.8-.2-1.6.2-2.2z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);
export const InstagramIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
export const LinkedInIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.3-2.6s2.2.9 2.2 2.6V16" />
  </svg>
);
export const XIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4l16 16M20 4L4 20" strokeWidth={1.6} />
  </svg>
);
export const MailIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);
