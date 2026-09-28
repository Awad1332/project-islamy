import { contact, footer, site, whatsappLink } from "@/content/site";
import { InstagramIcon, LinkedInIcon, MailIcon, WhatsAppIcon, XIcon } from "@/components/ui/Icons";
import { Logo } from "./Logo";

const socials = [
  { label: "واتساب", href: whatsappLink(), Icon: WhatsAppIcon },
  { label: "إنستغرام", href: contact.instagram, Icon: InstagramIcon },
  { label: "لينكدإن", href: contact.linkedin, Icon: LinkedInIcon },
  { label: "إكس", href: contact.x, Icon: XIcon },
];

export function Footer() {
  const year = new Date().getFullYear();
  const contactLinks = [
    { label: "واتساب", value: "راسلني مباشرة", href: whatsappLink(), Icon: WhatsAppIcon },
    { label: "البريد الإلكتروني", value: contact.email, href: `mailto:${contact.email}`, Icon: MailIcon },
    { label: "لينكدإن", value: "الملف المهني", href: contact.linkedin, Icon: LinkedInIcon },
    { label: "إنستغرام", value: "آخر الأعمال", href: contact.instagram, Icon: InstagramIcon },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-line bg-alt" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">
        تذييل الموقع
      </h2>
      <div className="container-x grid gap-12 pt-16 pb-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-10 lg:pt-20">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 leading-8 text-muted">{footer.description}</p>
          <ul className="mt-6 flex gap-2.5" aria-label="حسابات التواصل الاجتماعي">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-11 place-items-center rounded-full bg-white text-ink/70 ring-1 ring-line transition hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:ring-primary"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterColumn title="روابط سريعة" links={footer.pages} />
        <FooterColumn title="الخدمات" links={footer.services} />

        <div>
          <h3 className="text-base font-bold text-ink">تواصل معي</h3>
          <ul className="mt-5 grid gap-3">
            {contactLinks.map(({ label, value, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-white"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-primary ring-1 ring-line transition group-hover:bg-lilac">
                    <Icon className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-ink">{label}</span>
                    <span className="truncate text-sm text-muted" dir={value.includes("@") ? "ltr" : undefined}>
                      {value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted sm:flex-row">
          <p>
            © {year} {site.nameAr} — {site.nameEn}. جميع الحقوق محفوظة.
          </p>
          <p>صُمّم بعناية لتجارة إلكترونية أفضل في السعودية والخليج</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <ul className="mt-5 grid gap-3.5">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="text-muted transition hover:text-primary">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
