import { useId } from "react";

export type ProductKind =
  | "perfume"
  | "abaya"
  | "serum"
  | "ring"
  | "headphones"
  | "phone"
  | "watch"
  | "coffee"
  | "vase"
  | "bag"
  | "incense"
  | "lipstick"
  | "digital"
  | "service";

type Props = {
  kind: ProductKind;
  /** Main colour of the product. */
  tint?: string;
  className?: string;
  title?: string;
};

/**
 * Original, lightweight product illustrations used inside store mockups and
 * industry cards. Shading is built from white/black overlays so any tint works.
 */
export function ProductArt({ kind, tint = "#7047EB", className, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (n: string) => `${n}-${uid}`;
  const hl = `url(#${g("hl")})`;
  const sh = `url(#${g("sh")})`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={g("hl")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g("sh")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={g("floor")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="106" rx="34" ry="6" fill={`url(#${g("floor")})`} />
      {renderKind(kind, tint, hl, sh)}
    </svg>
  );
}

function renderKind(kind: ProductKind, t: string, hl: string, sh: string) {
  switch (kind) {
    case "perfume":
      return (
        <g>
          <rect x="52" y="14" width="16" height="14" rx="3" fill="#2a2433" />
          <rect x="52" y="14" width="16" height="14" rx="3" fill={hl} />
          <rect x="55" y="27" width="10" height="7" fill="#c9b27a" />
          <path d="M34 42c0-5 4-9 9-9h34c5 0 9 4 9 9v52c0 6-4 10-10 10H44c-6 0-10-4-10-10V42z" fill={t} opacity="0.92" />
          <path d="M34 42c0-5 4-9 9-9h34c5 0 9 4 9 9v52c0 6-4 10-10 10H44c-6 0-10-4-10-10V42z" fill={sh} />
          <path d="M34 42c0-5 4-9 9-9h34c5 0 9 4 9 9v52c0 6-4 10-10 10H44c-6 0-10-4-10-10V42z" fill={hl} />
          <rect x="46" y="60" width="28" height="20" rx="2" fill="#fff" opacity="0.85" />
          <rect x="51" y="66" width="18" height="2.5" rx="1.2" fill={t} opacity="0.8" />
          <rect x="54" y="72" width="12" height="2" rx="1" fill={t} opacity="0.45" />
          <rect x="40" y="40" width="4" height="50" rx="2" fill="#fff" opacity="0.35" />
        </g>
      );
    case "abaya":
      return (
        <g>
          <path d="M60 10c-4 0-7 3-7 7h14c0-4-3-7-7-7z" fill="#bca58f" />
          <path d="M60 16l-15 6-12 22 8 4 6-10-9 60h44l-9-60 6 10 8-4-12-22-15-6z" fill={t} />
          <path d="M60 16l-15 6-12 22 8 4 6-10-9 60h44l-9-60 6 10 8-4-12-22-15-6z" fill={sh} />
          <path d="M60 16l-15 6-12 22 8 4 6-10-9 60h44l-9-60 6 10 8-4-12-22-15-6z" fill={hl} opacity="0.6" />
          <path d="M60 18v84" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" />
          <path d="M53 20l7 14 7-14" fill="none" stroke="#e9d7b8" strokeWidth="2" />
          <path d="M38 98h44" stroke="#e9d7b8" strokeWidth="2" opacity="0.8" />
        </g>
      );
    case "serum":
      return (
        <g>
          <rect x="53" y="10" width="14" height="16" rx="6" fill="#1f1a28" />
          <rect x="50" y="24" width="20" height="10" rx="2" fill="#2d2735" />
          <rect x="40" y="34" width="40" height="70" rx="10" fill={t} opacity="0.85" />
          <rect x="40" y="34" width="40" height="70" rx="10" fill={sh} />
          <rect x="40" y="34" width="40" height="70" rx="10" fill={hl} />
          <rect x="46" y="58" width="28" height="26" rx="3" fill="#fff" opacity="0.9" />
          <circle cx="60" cy="66" r="3.5" fill={t} opacity="0.7" />
          <rect x="52" y="73" width="16" height="2" rx="1" fill={t} opacity="0.55" />
          <rect x="54" y="78" width="12" height="1.8" rx="0.9" fill={t} opacity="0.35" />
          <rect x="45" y="40" width="3.5" height="56" rx="1.7" fill="#fff" opacity="0.4" />
        </g>
      );
    case "lipstick":
      return (
        <g>
          <path d="M52 24c0-6 4-12 8-14 4 2 8 8 8 14v16H52V24z" fill={t} />
          <path d="M52 24c0-6 4-12 8-14 4 2 8 8 8 14v16H52V24z" fill={hl} />
          <rect x="48" y="40" width="24" height="14" rx="2" fill="#d8c08c" />
          <rect x="48" y="40" width="24" height="14" rx="2" fill={sh} />
          <rect x="44" y="54" width="32" height="50" rx="4" fill="#231d2c" />
          <rect x="44" y="54" width="32" height="50" rx="4" fill={hl} opacity="0.5" />
          <rect x="44" y="76" width="32" height="3" fill="#d8c08c" />
        </g>
      );
    case "ring":
      return (
        <g>
          <ellipse cx="60" cy="72" rx="28" ry="26" fill="none" stroke="#d6b35c" strokeWidth="9" />
          <ellipse
            cx="60"
            cy="72"
            rx="28"
            ry="26"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.4"
            strokeWidth="2"
            transform="translate(-2 -2)"
          />
          <path d="M46 44l6-14h16l6 14-14 12-14-12z" fill={t} />
          <path d="M46 44l6-14h16l6 14-14 12-14-12z" fill={hl} />
          <path d="M52 30l8 14 8-14M46 44h28M60 44v12" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
          <path d="M44 46h32l-4 6H48z" fill="#c29a3f" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path
            d="M28 70V58c0-18 14-32 32-32s32 14 32 32v12"
            fill="none"
            stroke="#2a2433"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect x="20" y="62" width="22" height="34" rx="10" fill={t} />
          <rect x="20" y="62" width="22" height="34" rx="10" fill={hl} />
          <rect x="78" y="62" width="22" height="34" rx="10" fill={t} />
          <rect x="78" y="62" width="22" height="34" rx="10" fill={sh} />
          <rect x="78" y="62" width="22" height="34" rx="10" fill={hl} opacity="0.6" />
          <rect x="36" y="66" width="8" height="26" rx="4" fill="#2a2433" />
          <rect x="76" y="66" width="8" height="26" rx="4" fill="#2a2433" />
        </g>
      );
    case "phone":
      return (
        <g>
          <rect x="38" y="12" width="44" height="92" rx="10" fill="#1d1927" />
          <rect x="42" y="17" width="36" height="82" rx="7" fill={t} />
          <rect x="42" y="17" width="36" height="82" rx="7" fill={hl} />
          <circle cx="60" cy="50" r="12" fill="#fff" opacity="0.25" />
          <circle cx="68" cy="62" r="16" fill="#fff" opacity="0.15" />
          <rect x="54" y="20" width="12" height="3" rx="1.5" fill="#1d1927" />
        </g>
      );
    case "watch":
      return (
        <g>
          <rect x="46" y="8" width="28" height="30" rx="6" fill="#2a2433" />
          <rect x="46" y="82" width="28" height="30" rx="6" fill="#2a2433" />
          <rect x="36" y="34" width="48" height="52" rx="14" fill="#3a3345" />
          <rect x="40" y="38" width="40" height="44" rx="11" fill={t} />
          <rect x="40" y="38" width="40" height="44" rx="11" fill={hl} />
          <path d="M60 50v11l7 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <rect x="84" y="52" width="4" height="12" rx="2" fill="#3a3345" />
        </g>
      );
    case "coffee":
      return (
        <g>
          <path
            d="M52 22c-3 4 3 6 0 10M62 18c-3 4 3 6 0 10M72 22c-3 4 3 6 0 10"
            stroke={t}
            strokeOpacity="0.45"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M84 56h6a10 10 0 010 20h-7" fill="none" stroke="#efe6dd" strokeWidth="6" />
          <path d="M30 42h56l-6 54c-.5 5-4.5 8-9.5 8h-25c-5 0-9-3-9.5-8L30 42z" fill="#f6efe8" />
          <path d="M30 42h56l-6 54c-.5 5-4.5 8-9.5 8h-25c-5 0-9-3-9.5-8L30 42z" fill={sh} />
          <path d="M33 62h50l-2.2 20H35.2z" fill={t} />
          <path d="M33 62h50l-2.2 20H35.2z" fill={hl} />
          <rect x="28" y="38" width="60" height="7" rx="3.5" fill="#fff" />
        </g>
      );
    case "vase":
      return (
        <g>
          <path
            d="M60 30c-2-10 4-18 12-20-2 8-6 14-12 20zM60 30c-6-8-14-10-20-8 4 6 12 9 20 8zM60 30c1-10 9-16 18-14-4 7-10 12-18 14z"
            fill="#6f9a57"
          />
          <path d="M60 30v14" stroke="#4f7a3a" strokeWidth="2" />
          <path d="M50 42h20c0 6 12 14 12 32 0 18-10 30-22 30S38 92 38 74c0-18 12-26 12-32z" fill={t} />
          <path d="M50 42h20c0 6 12 14 12 32 0 18-10 30-22 30S38 92 38 74c0-18 12-26 12-32z" fill={sh} />
          <path d="M50 42h20c0 6 12 14 12 32 0 18-10 30-22 30S38 92 38 74c0-18 12-26 12-32z" fill={hl} />
          <path d="M42 76c10 4 26 4 36 0" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" />
        </g>
      );
    case "bag":
      return (
        <g>
          <path d="M46 44V34a14 14 0 0128 0v10" fill="none" stroke="#3a2c24" strokeWidth="4" />
          <path d="M28 44h64l-4 56c-.3 3-2.8 5-5.8 5H37.8c-3 0-5.5-2-5.8-5L28 44z" fill={t} />
          <path d="M28 44h64l-4 56c-.3 3-2.8 5-5.8 5H37.8c-3 0-5.5-2-5.8-5L28 44z" fill={sh} />
          <path d="M28 44h64l-4 56c-.3 3-2.8 5-5.8 5H37.8c-3 0-5.5-2-5.8-5L28 44z" fill={hl} />
          <rect x="52" y="60" width="16" height="8" rx="2" fill="#e8d3a6" />
        </g>
      );
    case "incense":
      return (
        <g>
          <path
            d="M60 10c-5 6 5 8 0 14s5 8 0 14"
            stroke={t}
            strokeOpacity="0.4"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M50 40h20l-4 10H54z" fill="#c9a44f" />
          <path d="M44 50h32c0 8-4 12-4 16H48c0-4-4-8-4-16z" fill={t} />
          <path d="M44 50h32c0 8-4 12-4 16H48c0-4-4-8-4-16z" fill={hl} />
          <path d="M48 66h24l6 30H42z" fill={t} />
          <path d="M48 66h24l6 30H42z" fill={sh} />
          <path d="M48 66h24l6 30H42z" fill={hl} opacity="0.5" />
          <rect x="38" y="94" width="44" height="8" rx="2" fill="#c9a44f" />
          <path d="M54 76h12M52 84h16" stroke="#e8cf8e" strokeWidth="1.6" />
        </g>
      );
    case "digital":
      return (
        <g>
          <rect x="22" y="22" width="76" height="54" rx="7" fill="#231d2c" />
          <rect x="26" y="26" width="68" height="46" rx="4" fill={t} />
          <rect x="26" y="26" width="68" height="46" rx="4" fill={hl} />
          <path d="M55 40l12 9-12 9z" fill="#fff" />
          <rect x="14" y="78" width="92" height="6" rx="3" fill="#3a3345" />
          <rect x="30" y="90" width="60" height="12" rx="6" fill="#fff" />
          <rect x="36" y="94.5" width="30" height="3" rx="1.5" fill={t} />
          <circle cx="82" cy="96" r="3" fill={t} opacity="0.6" />
        </g>
      );
    case "service":
      return (
        <g>
          <rect x="24" y="20" width="72" height="84" rx="10" fill="#fff" />
          <rect x="24" y="20" width="72" height="84" rx="10" fill={sh} opacity="0.4" />
          <rect x="24" y="20" width="72" height="22" rx="10" fill={t} />
          <rect x="24" y="32" width="72" height="10" fill={t} />
          <path d="M36 56l4 4 7-8" stroke={t} strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="52" y="54" width="32" height="4" rx="2" fill="#d9d4e6" />
          <path d="M36 72l4 4 7-8" stroke={t} strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="52" y="70" width="26" height="4" rx="2" fill="#d9d4e6" />
          <rect x="36" y="86" width="48" height="10" rx="5" fill={t} opacity="0.9" />
        </g>
      );
  }
}
