import { site } from "@/content/site";
import { cn } from "@/lib/cn";

/** Small, honest label shown on sample / illustrative content. */
export function PlaceholderBadge({
  show = true,
  label = "مثال توضيحي",
  className,
}: {
  show?: boolean;
  label?: string;
  className?: string;
}) {
  if (!show || !site.showPlaceholderBadges) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-white/85 px-2.5 py-1 text-xs font-medium text-deep",
        className,
      )}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="8" r="6.2" />
        <path d="M8 7.2v3.6M8 5.2v.1" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}
