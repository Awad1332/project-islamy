# Awad Rabee | عوض ربيع — Portfolio

Arabic (RTL) personal portfolio for an e-commerce store designer & digital experience specialist.
Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4**, exported as a fully static site.

## Run it

```bash
cd portfolio
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out (deploy anywhere: Vercel, Netlify, GitHub Pages, any CDN)
npm run lint && npm run typecheck
```

## Edit the content — one file

Everything on the site lives in **`src/content/site.ts`**: brand, navigation, hero copy, statistics,
client logos, industries, services, customer journey, projects, tools, testimonials, about, FAQ,
final CTA, footer, and contact details.

Before publishing, update:

| What | Where in `site.ts` | Notes |
| --- | --- | --- |
| WhatsApp number, email, social links | `contact` | WhatsApp in international format without `+` (e.g. `9665XXXXXXXX`) |
| Domain (SEO, sitemap, Open Graph) | `site.url` | |
| Statistics | `stats.items` | Use **real** figures, then set `stats.isPlaceholder = false` |
| Client logos | `clients.items[].logo` | Put approved logos in `public/clients/`, then set `clients.isPlaceholder = false` |
| Projects | `projects` | Sample projects are marked `isIllustrative: true`. For real work add `images` (in `public/projects/`), `url`, and only add `outcome` when it is verifiable |
| Testimonials | `testimonials.items` | Only real feedback, with permission. Remove `isPlaceholder` |
| Portrait | `about.portrait` | e.g. put `public/awad.jpg` and set `"/awad.jpg"` |
| Skill levels | `tools.categories[].items[].level` | Describe your level honestly |

**Honesty by design:** anything still marked as placeholder or illustrative shows a small
"مثال توضيحي" label on the page, so visitors are never misled. When all content is real you can
turn the labels off globally with `site.showPlaceholderBadges = false`.

## Structure

```
src/
  app/                 layout (metadata, JSON-LD, fonts), home page, /projects/[slug], sitemap, robots
  content/site.ts      all editable content
  components/
    layout/            AnnouncementBar, Header (sticky + scroll-spy + mobile menu), Footer, BackToTop, Logo
    sections/          Hero, Stats, Clients, Industries, Services, Journey, Portfolio, Tools,
                       Testimonials, About, Faq, FinalCta
    portfolio/         ProjectCover, ProjectDetail (shared by modal and project pages)
    visuals/           Original SVG/CSS art: ProductArt, Store mockups (desktop/tablet/mobile),
                       MiniScreen, service visuals, abstract 3D shapes
    ui/                Button, SectionHeading, Reveal, Icons, PlaceholderBadge
```

## Features

- Arabic `lang="ar"` / `dir="rtl"`, IBM Plex Sans Arabic via `next/font`
- Sticky glass header with active-section highlighting; accessible mobile menu (focus trap, Esc)
- Scroll reveals as progressive enhancement: content is visible without JS and with reduced motion
- Count-up statistics that start when they scroll into view
- Filterable portfolio, project modal (native `<dialog>`), plus a static page per project
- Customer-journey tabs (arrow-key navigation, auto-advance only while visible)
- Swipeable testimonial carousel with buttons and dots
- Accessible FAQ accordion; WhatsApp CTAs with pre-filled messages
- SEO: metadata, Open Graph image, Twitter card, JSON-LD (Person, ProfessionalService, FAQPage), sitemap, robots
- `prefers-reduced-motion` respected throughout

All visuals are original (no third-party brand assets). The layout follows the rhythm of large
e-commerce platform landing pages, with its own identity and copy.
