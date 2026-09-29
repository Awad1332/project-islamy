import Link from "next/link";
import { Reveal } from "./Reveal";

type Props = { title: string; heading: string; text: string };

/** Header band for inner pages: breadcrumb, page name and a one-line promise. */
export function PageHero({ title, heading, text }: Props) {
  return (
    <section aria-labelledby="page-title" className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-lilac/80 via-lilac/30 to-white" />
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_0%,#000_20%,transparent_70%)]" />
        <div className="absolute -top-32 left-[10%] size-[28rem] rounded-full bg-primary/15 blur-[110px]" />
      </div>
      <div className="container-x pt-10 pb-14 text-center sm:pt-14 sm:pb-20">
        <Reveal>
          <nav aria-label="مسار التنقل" className="text-sm text-muted">
            <ol className="flex items-center justify-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary">
                  الرئيسية
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-medium text-primary">
                {title}
              </li>
            </ol>
          </nav>
          <h1
            id="page-title"
            className="mx-auto mt-6 max-w-3xl text-[2.2rem] leading-[1.25] font-bold text-ink sm:text-5xl sm:leading-[1.2]"
          >
            {heading}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">{text}</p>
        </Reveal>
      </div>
    </section>
  );
}
