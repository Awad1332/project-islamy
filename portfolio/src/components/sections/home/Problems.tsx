import { home } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const icons = [
  // traffic without orders
  <path key="a" d="M4 18l5-6 4 3 7-9M15 6h5v5" />,
  // abandoned cart
  <path key="b" d="M3 4h2l2.2 10.5a1 1 0 001 .8h8.9a1 1 0 001-.8L20 8H6.5M10 19.5h.01M17 19.5h.01M11 8l4 4M15 8l-4 4" />,
  // looks like everyone else
  <path key="c" d="M8 8h11v11H8zM5 16V5h11" />,
  // hard mobile experience
  <path key="d" d="M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2M10 9l4 4M14 9l-4 4" />,
];

export function Problems() {
  const d = home.problems;
  return (
    <section aria-labelledby="problems-title" className="bg-alt section-y">
      <div className="container-x">
        <SectionHeading id="problems-title" eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <Reveal as="li" key={it.title} delay={i * 70} className="rounded-[1.75rem] border border-line bg-white p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#fdeceb] text-[#c2413a]">
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {icons[i % icons.length]}
                </svg>
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{it.title}</h3>
              <p className="mt-2 leading-7 text-muted">{it.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
