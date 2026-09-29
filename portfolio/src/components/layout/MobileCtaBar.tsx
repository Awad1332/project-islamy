import { primaryOffer, whatsappLink } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/Icons";

/** Always-visible conversion bar on phones, where most store owners browse. */
export function MobileCtaBar() {
  return (
    <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <a
        href={whatsappLink(primaryOffer.message)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-white shadow-[0_10px_30px_-10px_rgb(112_71_235/0.7)]"
      >
        <WhatsAppIcon className="size-5" />
        {primaryOffer.label} عبر واتساب
      </a>
    </div>
  );
}
