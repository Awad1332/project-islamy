import { clients } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";

/** Neutral abstract marks used until real, approved client logos are added. */
function PlaceholderMark({ variant }: { variant: number }) {
  const shapes = [
    <circle key="a" cx="16" cy="16" r="11" />,
    <rect key="b" x="5" y="5" width="22" height="22" rx="6" />,
    <path key="c" d="M16 4l12 22H4z" />,
    <path key="d" d="M5 16a11 11 0 0122 0v11H5z" />,
    <path key="e" d="M16 4l3.5 8.5L28 16l-8.5 3.5L16 28l-3.5-8.5L4 16l8.5-3.5z" />,
    <path key="f" d="M4 10h24v12H4zM10 4h12v24H10z" />,
    <path key="g" d="M16 4a12 12 0 100 24 8 8 0 010-24z" />,
    <path key="h" d="M4 16h8l4-12 4 24 4-12h4" fill="none" strokeWidth="3" stroke="currentColor" />,
  ];
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" fill="currentColor" aria-hidden>
      {shapes[variant % shapes.length]}
    </svg>
  );
}

function LogoTile({ item }: { item: (typeof clients.items)[number] }) {
  return (
    <li className="group flex h-24 w-52 shrink-0 items-center justify-center rounded-2xl border border-line bg-white px-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft sm:w-60">
      {item.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.logo}
          alt={item.name}
          loading="lazy"
          className="max-h-10 w-auto opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
        />
      ) : (
        <span className="flex items-center gap-3 text-ink/35 transition-colors duration-300 group-hover:text-primary">
          <PlaceholderMark variant={item.mark} />
          <span className="text-lg font-bold">{item.name}</span>
        </span>
      )}
    </li>
  );
}

export function Clients() {
  const items = clients.items;
  return (
    <section aria-labelledby="clients-title" className="bg-alt py-20 sm:py-24 lg:py-28">
      <div className="container-x">
        <SectionHeading id="clients-title" title={clients.title} subtitle={clients.subtitle} />
        <div className="mt-6 flex justify-center">
          <PlaceholderBadge show={clients.isPlaceholder} label="شعارات مؤقتة — تُستبدل بشعارات العملاء المعتمدة" />
        </div>
      </div>

      <div className="group/marquee relative mt-12 overflow-hidden [mask-image:linear-gradient(to_left,transparent,#000_10%,#000_90%,transparent)]">
        <div className="flex w-max group-hover/marquee:[animation-play-state:paused] motion-safe:animate-marquee motion-reduce:w-full motion-reduce:justify-center">
          <ul
            className="flex gap-4 pe-4 motion-reduce:container-x motion-reduce:flex-wrap motion-reduce:justify-center"
            aria-label="العملاء والشركاء"
          >
            {items.map((c) => (
              <LogoTile key={c.name} item={c} />
            ))}
          </ul>
          <ul className="flex gap-4 pe-4 motion-reduce:hidden" aria-hidden>
            {items.map((c) => (
              <LogoTile key={c.name} item={c} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
