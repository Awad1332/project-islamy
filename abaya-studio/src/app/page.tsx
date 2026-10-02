import Link from "next/link";
import { Icon, Logo } from "@/components/ui";

const flow = ["اختاري", "صممي", "شاهدي", "عدّلي", "اعرفي السعر والمقاس", "اشتري"];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Logo />
        <Link href="/dashboard" className="text-sm text-ink-2 hover:text-ink">دخول التاجر</Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 lg:px-6">
        <section className="py-14 text-center lg:py-24">
          <p className="mb-4 text-xs tracking-[0.25em] text-gold" dir="ltr">ABAYA STUDIO AI</p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight lg:text-6xl">استوديو تصميم العبايات الرقمي لمتجرك</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-2">عميلاتك يصممن عبايتهن بأنفسهن، يشاهدنها على موديل، ويعرفن السعر والمقاس قبل الشراء.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/studio" className="inline-flex h-14 items-center gap-2 rounded-xl bg-ink px-7 text-paper">جربي تجربة العميلة <Icon name="arrowNext" className="size-4" /></Link>
            <Link href="/dashboard" className="inline-flex h-14 items-center gap-2 rounded-xl border border-line-2 bg-white px-7">لوحة التاجر</Link>
          </div>
          <ol className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted">
            {flow.map((f, i) => (
              <li key={f} className="flex items-center gap-3">
                <span className="text-ink">{f}</span>
                {i < flow.length - 1 && <span className="text-line-2">←</span>}
              </li>
            ))}
          </ol>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["layers", "محرك تهيئة حقيقي", "قواعد توافق وأسعار يحددها التاجر — المواصفات تأتي من المحرك وليس من الذكاء الاصطناعي."],
            ["sparkle", "تصور بصري ذكي", "تحويل الاختيارات إلى وصف منظم لمحرك توليد الصور، مع بديل توضيحي فوري."],
            ["chart", "بيانات تفضيلات السوق", "اعرفي ماذا تريد العميلات: القصات والألوان والتركيبات الأكثر طلبًا."],
          ].map(([icon, t, d]) => (
            <div key={t} className="rounded-3xl border border-line bg-white p-6">
              <span className="mb-4 grid size-10 place-items-center rounded-xl bg-sand"><Icon name={icon} /></span>
              <h2 className="font-display text-lg font-semibold">{t}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
