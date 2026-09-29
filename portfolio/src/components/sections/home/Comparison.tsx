import { home } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const Mark = ({ v }: { v: "yes" | "no" | "partial" }) => {
  if (v === "yes")
    return (
      <span className="inline-grid size-8 place-items-center rounded-full bg-primary text-white" aria-label="نعم">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  if (v === "partial")
    return (
      <span className="inline-grid size-8 place-items-center rounded-full bg-[#fff4d6] text-[#a4760f]" aria-label="جزئيًا">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path d="M6 12h12" />
        </svg>
      </span>
    );
  return (
    <span className="inline-grid size-8 place-items-center rounded-full bg-[#fdeceb] text-[#c2413a]" aria-label="لا">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    </span>
  );
};

export function Comparison() {
  const d = home.comparison;
  return (
    <section aria-labelledby="comparison-title" className="section-y">
      <div className="container-x">
        <SectionHeading id="comparison-title" eyebrow={d.eyebrow} title={d.title} />
        <Reveal className="mx-auto mt-12 max-w-4xl overflow-x-auto rounded-[2rem] border border-line bg-white shadow-soft">
          <table className="w-full min-w-[520px] border-collapse text-start">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="p-5 text-start text-sm font-semibold text-muted sm:p-6">
                  <span className="sr-only">الميزة</span>
                </th>
                <th scope="col" className="w-36 p-5 text-center text-sm font-semibold text-muted sm:p-6">
                  {d.columns[0]}
                </th>
                <th scope="col" className="w-44 bg-lilac/70 p-5 text-center text-sm font-bold text-primary sm:p-6">
                  {d.columns[1]}
                </th>
              </tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r.label} className="border-b border-line last:border-0">
                  <th scope="row" className="p-5 text-start font-medium text-ink sm:px-6">
                    {r.label}
                  </th>
                  <td className="p-5 text-center">
                    <Mark v={r.a} />
                  </td>
                  <td className="bg-lilac/40 p-5 text-center">
                    <Mark v={r.b} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
