import { home } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { SparkIcon } from "@/components/ui/Icons";

export function Commitment() {
  const d = home.commitment;
  return (
    <section aria-labelledby="commitment-title" className="bg-alt section-y">
      <div className="container-x">
        <SectionHeading id="commitment-title" eyebrow={d.eyebrow} title={d.title} />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <Reveal as="li" key={it.title} delay={i * 70} className="rounded-[1.75rem] border border-line bg-white p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-lilac text-primary">
                <SparkIcon className="size-5" />
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
