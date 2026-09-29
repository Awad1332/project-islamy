"use client";

import { useState, type FormEvent } from "react";
import { contact, home, whatsappLink } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { InstagramIcon, LinkedInIcon, MailIcon, WhatsAppIcon } from "@/components/ui/Icons";

const services = ["مراجعة مجانية لمتجري", ...home.packages.items.map((p) => `باقة ${p.name}`), "لست متأكدًا بعد"];
const timing = ["في أقرب وقت", "خلال الشهر القادم", "أستكشف الخيارات حاليًا"];

const field =
  "mt-2 block w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15";

export function ContactSection() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const lines = [
      `مرحبًا عوض، أنا ${f.get("name")}.`,
      f.get("store") ? `رابط المتجر: ${f.get("store")}` : "",
      `الخدمة المطلوبة: ${f.get("service")}`,
      `موعد البدء: ${f.get("timing")}`,
      f.get("message") ? `تفاصيل: ${f.get("message")}` : "",
    ].filter(Boolean);
    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener");
    setSent(true);
  };

  const channels = [
    { label: "واتساب", value: "أسرع طريقة للتواصل", href: whatsappLink(), Icon: WhatsAppIcon },
    { label: "البريد الإلكتروني", value: contact.email, href: `mailto:${contact.email}`, Icon: MailIcon, ltr: true },
    { label: "لينكدإن", value: "الملف المهني", href: contact.linkedin, Icon: LinkedInIcon },
    { label: "إنستغرام", value: "آخر الأعمال", href: contact.instagram, Icon: InstagramIcon },
  ];

  return (
    <section aria-labelledby="contact-form-title" className="pb-20 sm:pb-24 lg:pb-32">
      <div className="container-x grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
        <Reveal className="rounded-[2rem] border border-line bg-white p-6 shadow-card sm:p-10">
          <h2 id="contact-form-title" className="text-2xl font-bold text-ink sm:text-3xl">
            أخبرني عن مشروعك
          </h2>
          <p className="mt-2 text-muted">تُرسل رسالتك جاهزة عبر واتساب، ولا يُحفظ أي شيء في الموقع.</p>

          <form onSubmit={onSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="block font-medium text-ink">
              الاسم
              <input id="contact-name" name="name" required autoComplete="name" className={field} placeholder="اسمك الكريم" />
            </label>
            <label className="block font-medium text-ink">
              رابط المتجر <span className="text-sm font-normal text-muted">(اختياري)</span>
              <input
                id="contact-store"
                name="store"
                type="url"
                dir="ltr"
                inputMode="url"
                className={`${field} text-start`}
                placeholder="https://"
              />
            </label>
            <label className="block font-medium text-ink">
              الخدمة المطلوبة
              <select id="contact-service" name="service" className={field} defaultValue={services[0]}>
                {services.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block font-medium text-ink">
              متى تريد البدء؟
              <select id="contact-timing" name="timing" className={field} defaultValue={timing[0]}>
                {timing.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block font-medium text-ink sm:col-span-2">
              تفاصيل إضافية <span className="text-sm font-normal text-muted">(اختياري)</span>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                className={field}
                placeholder="نوع منتجاتك، أهم ما تريد تحسينه، أو أي سؤال لديك"
              />
            </label>
            <div className="flex flex-col items-start gap-3 sm:col-span-2">
              <button
                type="submit"
                className="inline-flex h-14 items-center gap-2.5 rounded-full bg-primary px-8 text-lg font-semibold text-white shadow-[0_10px_30px_-10px_rgb(112_71_235/0.7)] transition hover:bg-primary-600"
              >
                <WhatsAppIcon className="size-5" />
                أرسل عبر واتساب
              </button>
              <p role="status" className="text-sm text-muted">
                {sent ? "فُتحت محادثة واتساب برسالتك. اضغط إرسال هناك لتصلني." : "سأرد عليك في أقرب وقت خلال أيام العمل."}
              </p>
            </div>
          </form>
        </Reveal>

        <div className="grid content-start gap-6">
          <Reveal className="rounded-[2rem] bg-alt p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ink">ماذا يحدث بعد رسالتك؟</h2>
            <ol className="mt-5 grid gap-4">
              {["أراجع متجرك أو فكرتك", "أرسل لك ملاحظات وخطوة تالية مقترحة", "إن ناسبك، نتفق على النطاق والسعر ونبدأ"].map(
                (t, i) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="leading-7 text-ink">{t}</span>
                  </li>
                ),
              )}
            </ol>
          </Reveal>
          <Reveal delay={80}>
            <ul className="grid gap-3">
              {channels.map(({ label, value, href, Icon, ltr }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-primary/30 hover:shadow-soft"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lilac text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-semibold text-ink">{label}</span>
                      <span className="truncate text-sm text-muted select-all" dir={ltr ? "ltr" : undefined}>
                        {value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
