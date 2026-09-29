/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONTENT — the single place to edit everything on the website.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  • Anything marked `isPlaceholder: true` is sample content. It is shown with
 *    a small "مثال توضيحي" label so visitors are never misled. Replace it with
 *    real data and set `isPlaceholder: false` (or remove the flag).
 *  • Statistics, testimonials, client logos and project results must reflect
 *    real, verifiable information only.
 *  • Contact numbers / emails / social URLs below are placeholders — update
 *    them before publishing.
 */

import type { ProductKind } from "@/components/visuals/ProductArt";

/* ─────────────────────────────── Types ─────────────────────────────── */

export type StoreTheme = {
  /** Brand/accent colour used for buttons & highlights inside the mockup. */
  primary: string;
  /** Soft background tint for banners and cards. */
  soft: string;
  /** Text/ink colour for the mockup. */
  ink: string;
  /** Page background of the mockup. */
  surface: string;
};

export type Project = {
  slug: string;
  name: string;
  category: ProjectCategory;
  categoryLabel: string;
  summary: string;
  services: string[];
  /** True when this is an illustrative concept, not a delivered client project. */
  isIllustrative: boolean;
  /** Optional link to the live store. */
  url?: string;
  /** Optional real screenshots (place files in /public/projects/...). When empty, a generated mockup is shown. */
  images?: { src: string; alt: string }[];
  year?: string;
  theme: StoreTheme;
  products: ProductKind[];
  tagline: string;
  overview: string;
  objectives: string[];
  approach: string[];
  /** Only fill this with real, verifiable project outcomes. Leave undefined otherwise. */
  outcome?: string;
};

export type ProjectCategory = "fashion" | "beauty" | "perfume" | "electronics" | "other";

export type Testimonial = {
  quote: string;
  name: string;
  category: string;
  url?: string;
  isPlaceholder?: boolean;
};

/* ─────────────────────────────── Brand ─────────────────────────────── */

export const site = {
  url: "https://awadrabee.com", // TODO: replace with the real domain
  nameAr: "عوض ربيع",
  nameEn: "Awad Rabee",
  titleAr: "مصمم متاجر إلكترونية ومتخصص في تجربة المستخدم",
  titleEn: "E-commerce Store Designer & Digital Experience Specialist",
  descriptor: "تصميم وتطوير تجربة المتاجر الإلكترونية",
  seoDescription:
    "عوض ربيع — مصمم متاجر إلكترونية ومتخصص في تجربة المستخدم. أصمم متاجر احترافية على سلة وغيرها تجمع بين الهوية المميزة وسهولة الاستخدام وتجربة تسوق تخدم أهداف نشاطك التجاري في السعودية والخليج.",
  keywords: [
    "تصميم متاجر إلكترونية",
    "تصميم متجر سلة",
    "تجربة المستخدم",
    "UX",
    "تطوير واجهات المتاجر",
    "تحسين المتاجر",
    "مصمم متاجر السعودية",
    "Awad Rabee",
    "عوض ربيع",
  ],
  /** Show the "مثال توضيحي" badges on placeholder content. Keep true until all data is real. */
  showPlaceholderBadges: true,
};

export const contact = {
  /** International format without "+" or spaces. TODO: replace with the real number. */
  whatsapp: "966500000000",
  whatsappMessage: "مرحبًا عوض، أرغب في التحدث معك بخصوص مشروع متجر إلكتروني.",
  email: "hello@awadrabee.com", // TODO
  linkedin: "https://www.linkedin.com/", // TODO
  instagram: "https://www.instagram.com/", // TODO
  x: "https://x.com/", // TODO
  location: "المملكة العربية السعودية ودول الخليج",
};

export const whatsappLink = (message = contact.whatsappMessage) =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;

/* ─────────────────────────── Announcement ─────────────────────────── */

export const announcement = {
  enabled: true,
  text: "احجز مراجعة مجانية لمتجرك واعرف أين يخسر متجرك عملاءه",
  linkLabel: "احجز الآن",
  href: "/contact/",
};

/* ─────────────────────────────── Nav ─────────────────────────────── */

export const nav = [
  { label: "الرئيسية", href: "/" },
  { label: "من أنا", href: "/about/" },
  { label: "خدماتي", href: "/services/" },
  { label: "أعمالي", href: "/work/" },
  { label: "خبراتي", href: "/expertise/" },
  { label: "تواصل معي", href: "/contact/" },
];

/** Main conversion action used across the site (header button, mobile bar, CTAs). */
export const primaryOffer = {
  label: "احجز مراجعة مجانية",
  message: "مرحبًا عوض، أرغب في مراجعة مجانية لمتجري. رابط المتجر: ",
};

/* ─────────────────────────────── Hero ─────────────────────────────── */

export const hero = {
  badge: "تصميم متاجر سلة لأصحاب العلامات في السعودية والخليج",
  titleLead: "أحوّل متجرك الإلكتروني إلى",
  titleHighlight: "تجربة تستحق أن تُشترى",
  paragraph:
    "أصمم لك متجرًا يبني ثقة عميلك من أول زيارة، ويختصر طريقه من تصفح المنتج إلى إتمام الطلب. تصميم مخصص لعلامتك، مبني على فهم جمهورك، ومجهّز للجوال قبل كل شيء.",
  primaryCta: { label: "احجز مراجعة مجانية لمتجرك", href: "/contact/" },
  secondaryCta: { label: "شاهد الباقات", href: "#packages" },
  trust: "مراجعة مجانية بدون أي التزام. ترسل رابط متجرك وتستلم ملاحظات عملية.",
  bullets: ["تصميم مخصص لا قوالب مكررة", "تجربة جوال أولًا", "مراحل تسليم واضحة", "متابعة بعد الإطلاق"],
};

/* ───────────────────────────── Statistics ───────────────────────────── */
// ⚠️ Replace these with your REAL figures, then set `isPlaceholder: false`.

export const stats = {
  title: "خبرة تُترجم إلى تجارب رقمية",
  subtitle: "أرقام تعكس رحلة من العمل المستمر على تصميم وتطوير المتاجر.",
  isPlaceholder: true,
  items: [
    { value: 40, suffix: "+", label: "مشروع مكتمل", hint: "بين تصميم وتطوير وتحسين" },
    { value: 25, suffix: "+", label: "متجر إلكتروني مصمم", hint: "على سلة ومنصات أخرى" },
    { value: 5, suffix: "", label: "سنوات من الخبرة", hint: "في التصميم الرقمي" },
    { value: 6, suffix: "", label: "خدمات متخصصة", hint: "من الفكرة إلى الإطلاق" },
  ],
};

/* ─────────────────────────────── Clients ─────────────────────────────── */
// Add real, approved logos: put files in /public/clients and set `logo`.

export const clients = {
  title: "شركاء في صناعة تجارب استثنائية",
  subtitle: "أعتز بالعمل مع علامات تجارية ورواد أعمال يسعون لتقديم تجربة مختلفة لعملائهم.",
  isPlaceholder: true,
  items: [
    { name: "شعار عميل ١", logo: undefined as string | undefined, mark: 0 },
    { name: "شعار عميل ٢", logo: undefined, mark: 1 },
    { name: "شعار عميل ٣", logo: undefined, mark: 2 },
    { name: "شعار عميل ٤", logo: undefined, mark: 3 },
    { name: "شعار عميل ٥", logo: undefined, mark: 4 },
    { name: "شعار عميل ٦", logo: undefined, mark: 5 },
    { name: "شعار عميل ٧", logo: undefined, mark: 6 },
    { name: "شعار عميل ٨", logo: undefined, mark: 7 },
  ],
};

/* ───────────────────────────── Industries ───────────────────────────── */

export const industries = {
  eyebrow: "القطاعات",
  title: "تجارب رقمية تناسب طبيعة كل نشاط",
  subtitle: "لكل علامة تجارية جمهور مختلف، ولكل نشاط تفاصيل تستحق أن تظهر في تصميمه.",
  items: [
    {
      title: "الأزياء والعبايات",
      text: "عرض أنيق للقصّات والخامات والمقاسات.",
      product: "abaya",
      from: "#F6EEE8",
      to: "#EBD9CC",
      accent: "#8A5A44",
    },
    {
      title: "العطور والبخور",
      text: "تجربة حسّية تنقل الفخامة عبر الشاشة.",
      product: "perfume",
      from: "#F3EDFF",
      to: "#E0D3FF",
      accent: "#5B3DC8",
    },
    {
      title: "التجميل والعناية",
      text: "وضوح المكوّنات وسهولة اختيار المنتج.",
      product: "serum",
      from: "#FFF0F3",
      to: "#FBD9E1",
      accent: "#C0476A",
    },
    {
      title: "المجوهرات والإكسسوارات",
      text: "تفاصيل دقيقة تُبرز قيمة كل قطعة.",
      product: "ring",
      from: "#FBF6E9",
      to: "#F1E4BF",
      accent: "#A07A1F",
    },
    {
      title: "الإلكترونيات",
      text: "مقارنة المواصفات بوضوح وثقة.",
      product: "headphones",
      from: "#EDF3FF",
      to: "#D5E3FF",
      accent: "#2F5BD3",
    },
    {
      title: "المنتجات الرقمية",
      text: "رحلة شراء سريعة وتسليم فوري.",
      product: "digital",
      from: "#EEFAF6",
      to: "#CFF0E4",
      accent: "#11875F",
    },
    {
      title: "المطاعم والكافيهات",
      text: "قوائم شهية وطلب بخطوات قليلة.",
      product: "coffee",
      from: "#FBF1EA",
      to: "#F2DCCB",
      accent: "#9A5B2E",
    },
    {
      title: "مستلزمات المنزل",
      text: "إلهام بصري يساعد على تخيّل المنتج.",
      product: "vase",
      from: "#F2F6EF",
      to: "#DCE8D3",
      accent: "#4F7A3A",
    },
    {
      title: "الخدمات الرقمية",
      text: "عرض الباقات والحجز بطريقة مقنعة.",
      product: "service",
      from: "#F4F2FA",
      to: "#E3DEF3",
      accent: "#40218C",
    },
  ] as { title: string; text: string; product: ProductKind; from: string; to: string; accent: string }[],
};

/* ─────────────────────────────── Services ─────────────────────────────── */

export type ServiceVisual = "store" | "journey" | "components" | "beforeAfter" | "brand";

export const services = {
  eyebrow: "خدماتي",
  title: "حلول تصميم ترتقي بمتجرك في كل خطوة",
  subtitle: "من الفكرة الأولى إلى أدق تفاصيل تجربة الشراء، أعمل على تصميم متاجر تجمع بين الجمال والوضوح والوظيفة.",
  items: [
    {
      id: "store-design",
      number: "01",
      label: "تصميم المتاجر الإلكترونية",
      title: "تصميم متجر يعكس قيمة علامتك التجارية",
      description: "أصمم واجهات متاجر إلكترونية تعكس شخصية العلامة التجارية وتمنح العميل تجربة بصرية متناسقة وسهلة.",
      points: [
        "تصميم واجهات متناسقة مع الهوية البصرية",
        "تنظيم الأقسام والمنتجات بطريقة واضحة",
        "تحسين العرض على الجوال والأجهزة المختلفة",
        "الاهتمام بالتفاصيل البصرية وتجربة التصفح",
      ],
      visual: "store",
    },
    {
      id: "ux",
      number: "02",
      label: "تجربة المستخدم",
      title: "تجربة استخدام تبدأ من أول نقرة",
      description: "أرتب رحلة العميل داخل المتجر بشكل يساعده على اكتشاف المنتجات والوصول إلى المعلومات وإتمام الشراء بسهولة.",
      points: [
        "تنظيم القوائم والتصنيفات",
        "تحسين رحلة الوصول إلى المنتج",
        "تصميم صفحات منتجات واضحة",
        "تقليل التعقيد في تجربة التصفح والشراء",
      ],
      visual: "journey",
    },
    {
      id: "development",
      number: "03",
      label: "تطوير واجهات المتاجر",
      title: "تفاصيل تقنية تمنح التصميم مرونة أكبر",
      description: "تحويل الأفكار والتصاميم إلى واجهات عملية مع الاستفادة من إمكانات منصات التجارة الإلكترونية.",
      points: [
        "تخصيص واجهات المتاجر حسب الإمكانات المتاحة",
        "تحسين تناسق المكونات البصرية",
        "تنظيم تجربة الاستخدام عبر مختلف الشاشات",
        "مراعاة قابلية الصيانة والتطوير",
      ],
      visual: "components",
    },
    {
      id: "improvement",
      number: "04",
      label: "تحسين المتاجر",
      title: "تطوير متجرك يبدأ من فهم تفاصيله",
      description: "مراجعة تجربة المتجر الحالية وتحديد فرص التحسين في التصميم والتنظيم وسهولة الاستخدام.",
      points: [
        "مراجعة الواجهة الرئيسية",
        "تقييم ترتيب الأقسام والمنتجات",
        "اكتشاف مشكلات العرض والتصفح",
        "اقتراح تحسينات قابلة للتنفيذ",
      ],
      visual: "beforeAfter",
    },
    {
      id: "brand",
      number: "05",
      label: "تجربة العلامة التجارية",
      title: "هوية متكاملة تظهر في كل تفصيلة",
      description: "العمل على إبراز شخصية العلامة التجارية داخل المتجر، من الألوان والخطوط إلى الصور وطريقة عرض المنتجات.",
      points: [
        "تطبيق الهوية البصرية",
        "تناسق الصور والألوان",
        "تطوير الأسلوب البصري للواجهة",
        "تصميم تجربة متكاملة مع شخصية العلامة",
      ],
      visual: "brand",
    },
  ] as {
    id: string;
    number: string;
    label: string;
    title: string;
    description: string;
    points: string[];
    visual: ServiceVisual;
  }[],
};

/* ───────────────────────────── Customer journey ───────────────────────────── */

export type ScreenKind = "home" | "category" | "product" | "cart" | "checkout";

export const journey = {
  eyebrow: "تجربة العميل",
  title: "كل تفصيلة في المتجر تصنع تجربة",
  subtitle: "أنظر إلى المتجر بعين العميل: من اللحظة التي يصل فيها، حتى يضغط زر إتمام الطلب وهو مطمئن لاختياره.",
  steps: [
    {
      number: "01",
      title: "اكتشاف المتجر",
      text: "انطباع أول واضح: من أنت، وماذا تقدّم، ولماذا يثق بك العميل خلال ثوانٍ.",
      screen: "home",
    },
    {
      number: "02",
      title: "تصفح الأقسام",
      text: "تصنيفات منطقية وفلاتر مفهومة توصل العميل إلى ما يبحث عنه دون عناء.",
      screen: "category",
    },
    {
      number: "03",
      title: "استعراض المنتج",
      text: "صور معبّرة، وصف مختصر، ومعلومات أساسية تجيب عن أسئلة العميل قبل أن يسألها.",
      screen: "product",
    },
    {
      number: "04",
      title: "اتخاذ قرار الشراء",
      text: "سلة واضحة، تكلفة شفافة، وعناصر طمأنة تساعد العميل على اتخاذ قراره بثقة.",
      screen: "cart",
    },
    {
      number: "05",
      title: "إتمام الطلب",
      text: "خطوات دفع قليلة ومرتبة، مع تأكيد واضح يترك انطباعًا جيدًا بعد الشراء.",
      screen: "checkout",
    },
  ] as { number: string; title: string; text: string; screen: ScreenKind }[],
};

/* ─────────────────────────────── Projects ─────────────────────────────── */
// These are ILLUSTRATIVE concepts until replaced with real client work.
// To add a real project: set isIllustrative: false, add `images`, `url`, and
// only add `outcome` when you have real, verifiable results.

export const portfolio = {
  eyebrow: "أعمالي",
  title: "أعمال تحكي تفاصيل التجربة",
  subtitle: "مجموعة من المتاجر والتجارب الرقمية التي عملت على تصميمها وتطوير واجهاتها.",
  filters: [
    { key: "all", label: "جميع المشاريع" },
    { key: "fashion", label: "الأزياء والعبايات" },
    { key: "beauty", label: "التجميل والعناية" },
    { key: "perfume", label: "العطور" },
    { key: "electronics", label: "الإلكترونيات" },
    { key: "other", label: "قطاعات أخرى" },
  ] as { key: ProjectCategory | "all"; label: string }[],
};

export const projects: Project[] = [
  {
    slug: "layan-abayas",
    name: "ليان للعبايات",
    tagline: "أناقة هادئة بلمسة عصرية",
    category: "fashion",
    categoryLabel: "الأزياء والعبايات",
    summary: "تصور لمتجر عبايات يبرز تفاصيل القصّات والخامات بتجربة تصفح هادئة وأنيقة.",
    services: ["تصميم المتجر", "تجربة المستخدم", "تصميم الجوال"],
    isIllustrative: true,
    theme: { primary: "#8A5A44", soft: "#F6EEE8", ink: "#2B1F1A", surface: "#FFFCFA" },
    products: ["abaya", "abaya", "bag", "abaya"],
    overview:
      "مشروع توضيحي يعرض أسلوبي في تصميم متاجر الأزياء: واجهة تمنح الصور المساحة الأكبر، وتنظيم يسهّل الوصول إلى المجموعات والمقاسات.",
    objectives: [
      "إبراز جودة الخامات وتفاصيل القصّات",
      "تسهيل اختيار المقاس واللون",
      "تجربة جوال مريحة لعميلات يتسوقن غالبًا من الهاتف",
    ],
    approach: [
      "لوحة ألوان دافئة مستوحاة من الأقمشة الطبيعية",
      "بطاقات منتجات بصور كبيرة ومعلومات مختصرة",
      "دليل مقاسات قريب من زر الإضافة للسلة",
    ],
  },
  {
    slug: "oud-house",
    name: "دار العود",
    tagline: "حكاية عطر تُروى بالتفاصيل",
    category: "perfume",
    categoryLabel: "العطور والبخور",
    summary: "تصور لمتجر عطور وبخور بطابع فاخر يوازن بين الفخامة ووضوح رحلة الشراء.",
    services: ["تصميم المتجر", "تجربة العلامة التجارية", "تطوير الواجهة"],
    isIllustrative: true,
    theme: { primary: "#5B3DC8", soft: "#F1ECFF", ink: "#1E1638", surface: "#FFFFFF" },
    products: ["perfume", "incense", "perfume", "perfume"],
    overview: "مشروع توضيحي لمتجر عطور يعتمد على السرد البصري: وصف مكوّنات العطر ونوتاته بطريقة جذابة دون إثقال الصفحة.",
    objectives: ["نقل إحساس الفخامة رقميًا", "تعريف العميل بعائلات العطور", "تسهيل اختيار الهدايا"],
    approach: ["هرم عطري مرئي في صفحة المنتج", "تصنيف حسب المناسبة والعائلة العطرية", "قسم مخصص لتغليف الهدايا"],
  },
  {
    slug: "nada-care",
    name: "ندى للعناية",
    tagline: "عناية واضحة من أول نظرة",
    category: "beauty",
    categoryLabel: "التجميل والعناية",
    summary: "تصور لمتجر عناية بالبشرة يوضّح المكوّنات والاستخدام ويساعد على اختيار المنتج المناسب.",
    services: ["تجربة المستخدم", "تصميم صفحات المنتجات", "تصميم الجوال"],
    isIllustrative: true,
    theme: { primary: "#C0476A", soft: "#FFF0F3", ink: "#2A1520", surface: "#FFFFFF" },
    products: ["serum", "lipstick", "serum", "serum"],
    overview: "مشروع توضيحي يركّز على صفحة المنتج: المكوّنات، نوع البشرة، وطريقة الاستخدام في بطاقات سهلة القراءة.",
    objectives: ["توضيح فوائد كل منتج", "الاختيار حسب نوع البشرة", "بناء الثقة عبر الشفافية"],
    approach: ["أيقونات للمكوّنات الأساسية", "روتين عناية مقترح", "مقارنة سريعة بين المنتجات"],
  },
  {
    slug: "volt-tech",
    name: "فولت تك",
    tagline: "مواصفات واضحة، قرار أسرع",
    category: "electronics",
    categoryLabel: "الإلكترونيات",
    summary: "تصور لمتجر إلكترونيات يسهّل مقارنة المواصفات والوصول إلى المنتج المناسب.",
    services: ["تجربة المستخدم", "تنظيم التصنيفات", "تطوير الواجهة"],
    isIllustrative: true,
    theme: { primary: "#2F5BD3", soft: "#EDF3FF", ink: "#101B33", surface: "#FFFFFF" },
    products: ["headphones", "phone", "watch", "headphones"],
    overview: "مشروع توضيحي لمتجر إلكترونيات يعالج كثرة المواصفات عبر فلاتر ذكية وجداول مقارنة مختصرة.",
    objectives: ["تبسيط عرض المواصفات", "فلاتر تناسب طريقة بحث العميل", "إبراز الضمان وخيارات التوصيل"],
    approach: ["فلاتر حسب الاستخدام لا المواصفة فقط", "مقارنة جنبًا إلى جنب", "شارات للمزايا الأساسية"],
  },
  {
    slug: "bayt-living",
    name: "بيت ليفنج",
    tagline: "مساحات تشبهك",
    category: "other",
    categoryLabel: "مستلزمات المنزل",
    summary: "تصور لمتجر ديكور ومستلزمات منزلية يعتمد على الإلهام البصري والمجموعات المتناسقة.",
    services: ["تصميم المتجر", "تجربة العلامة التجارية"],
    isIllustrative: true,
    theme: { primary: "#4F7A3A", soft: "#F2F6EF", ink: "#1B2616", surface: "#FFFFFF" },
    products: ["vase", "vase", "coffee", "vase"],
    overview: "مشروع توضيحي لمتجر منزلي يعرض المنتجات ضمن مساحات ومجموعات مقترحة تساعد العميل على تخيّلها في منزله.",
    objectives: ["عرض المنتجات ضمن سياق", "بيع المجموعات المتكاملة", "إلهام بصري دون تشتيت"],
    approach: ["أقسام حسب الغرفة والطابع", "صور بيئية مع نقاط منتجات", "تدرجات لونية طبيعية"],
  },
  {
    slug: "qahwa-corner",
    name: "ركن القهوة",
    tagline: "طلبك المفضل بخطوات أقل",
    category: "other",
    categoryLabel: "المطاعم والكافيهات",
    summary: "تصور لمتجر محمصة وكافيه يجمع بين بيع المحاصيل والطلب السريع للمشروبات.",
    services: ["تجربة المستخدم", "تصميم الجوال", "تطوير الواجهة"],
    isIllustrative: true,
    theme: { primary: "#9A5B2E", soft: "#FBF1EA", ink: "#2A1A10", surface: "#FFFDFB" },
    products: ["coffee", "coffee", "incense", "coffee"],
    overview: "مشروع توضيحي يوازن بين قسمين مختلفين: محاصيل القهوة المختصة، والطلب السريع من الفرع.",
    objectives: ["فصل مسارات الشراء بوضوح", "وصف المحاصيل بلغة بسيطة", "طلب سريع من الجوال"],
    approach: ["مسار مستقل لكل نوع طلب", "بطاقات تذوّق مختصرة", "إعادة الطلب بنقرة"],
  },
];

/* ─────────────────────────────── Tools ─────────────────────────────── */
// Adjust `level` and `description` to honestly reflect how you use each tool.

export const tools = {
  eyebrow: "خبراتي",
  title: "الأدوات التي أحوّل بها الأفكار إلى واقع",
  subtitle: "أختار الأداة المناسبة لكل مرحلة، وأركّز على ما يخدم المشروع لا على الأداة نفسها.",
  categories: [
    {
      title: "منصات التجارة الإلكترونية",
      items: [
        {
          name: "سلة",
          latin: "Salla",
          mono: "س",
          color: "#004956",
          level: "تخصص رئيسي",
          description: "تصميم وتخصيص واجهات المتاجر وتنظيم الأقسام والمنتجات.",
        },
        {
          name: "ووردبريس",
          latin: "WordPress",
          mono: "W",
          color: "#21759B",
          level: "استخدام عملي",
          description: "بناء مواقع ومتاجر وتخصيص القوالب حسب احتياج المشروع.",
        },
      ],
    },
    {
      title: "التصميم والنماذج الأولية",
      items: [
        {
          name: "فيجما",
          latin: "Figma",
          mono: "F",
          color: "#7047EB",
          level: "أداة التصميم الأساسية",
          description: "تصميم الواجهات، أنظمة المكوّنات، والنماذج التفاعلية.",
        },
      ],
    },
    {
      title: "تخصيص الواجهات",
      items: [
        {
          name: "HTML و CSS",
          latin: "HTML & CSS",
          mono: "</>",
          color: "#E4572E",
          level: "استخدام عملي",
          description: "بناء وتخصيص الواجهات وضبط تجاوبها مع مختلف الشاشات.",
        },
        {
          name: "جافاسكربت",
          latin: "JavaScript",
          mono: "JS",
          color: "#B58B00",
          level: "مستوى تطبيقي",
          description: "إضافة تفاعلات وتحسينات على واجهات المتاجر.",
        },
      ],
    },
    {
      title: "الذكاء الاصطناعي والأتمتة",
      items: [
        {
          name: "أدوات التصميم بالذكاء الاصطناعي",
          latin: "AI Design Tools",
          mono: "AI",
          color: "#40218C",
          level: "استخدام داعم",
          description: "تسريع الاستكشاف البصري وتوليد الأفكار والمحتوى الأولي.",
        },
        {
          name: "أدوات أتمتة سير العمل",
          latin: "Automation",
          mono: "⟳",
          color: "#11875F",
          level: "استخدام داعم",
          description: "تنظيم المهام المتكررة وربط الأدوات لتسليم أسرع.",
        },
      ],
    },
  ],
};

/* ───────────────────────────── Testimonials ───────────────────────────── */
// ⚠️ Only publish REAL client feedback, with permission. The entries below are
// placeholders and are clearly labelled on the page until you replace them.

export const testimonials = {
  eyebrow: "آراء العملاء",
  title: "تجارب حقيقية، وانطباعات أعتز بها",
  subtitle: "كلمات من أصحاب المتاجر الذين عملت معهم.",
  items: [
    {
      quote: "هنا يظهر رأي العميل كما كتبه، بعد الحصول على موافقته على النشر. استبدل هذا النص بتجربة حقيقية.",
      name: "اسم العميل",
      category: "متجر أزياء",
      isPlaceholder: true,
    },
    {
      quote: "مساحة مخصصة لانطباع حقيقي من صاحب متجر عن تجربة العمل: التواصل، الالتزام، وجودة النتيجة.",
      name: "اسم العميل",
      category: "متجر عطور",
      isPlaceholder: true,
    },
    {
      quote: "أضف هنا رأي عميل حقيقي يصف ما تغيّر في متجره بعد المشروع، دون مبالغة أو أرقام غير موثقة.",
      name: "اسم العميل",
      category: "متجر عناية وتجميل",
      isPlaceholder: true,
    },
    {
      quote: "يمكن ربط كل رأي بمتجر العميل عبر رابط اختياري، لتعزيز المصداقية لدى الزائر.",
      name: "اسم العميل",
      category: "متجر إلكترونيات",
      isPlaceholder: true,
    },
  ] as Testimonial[],
};

/* ─────────────────────────────── About ─────────────────────────────── */

export const about = {
  eyebrow: "من أنا",
  title: "وراء كل تصميم فكرة واهتمام بالتفاصيل",
  /** Put your photo at /public/awad.jpg and set this to "/awad.jpg". */
  portrait: undefined as string | undefined,
  paragraphs: [
    "أنا عوض ربيع، مصمم متاجر إلكترونية أعمل مع العلامات التجارية ورواد الأعمال في السعودية والخليج. أجمع في عملي بين الإبداع البصري، وسهولة الاستخدام، والفهم التجاري لطبيعة كل نشاط.",
    "أؤمن أن المتجر الناجح ليس الأجمل شكلًا فقط، بل الأوضح للعميل والأقرب لأهداف صاحبه. لذلك أبدأ كل مشروع بفهم النشاط: من هم العملاء؟ ماذا يبحثون؟ وما الذي يجعلهم يثقون ويشترون؟",
  ],
  pillars: [
    { title: "فهم النشاط أولًا", text: "أتعرّف على جمهورك ومنتجاتك وأهدافك قبل أي قرار تصميمي." },
    { title: "وضوح قبل الزخرفة", text: "كل عنصر في الصفحة له سبب، وكل خطوة تقرّب العميل من الشراء." },
    { title: "اهتمام بالتفاصيل", text: "من المسافات والخطوط إلى تجربة الجوال وحالات الأزرار." },
    { title: "تحسين مستمر", text: "أتابع ما يستجد في التجارة الإلكترونية لأطوّر أدواتي وأسلوبي." },
  ],
  cta: "خلّنا نتعرف على مشروعك",
};

/* ─────────────────────────────── FAQ ─────────────────────────────── */

export const faq = {
  eyebrow: "الأسئلة الشائعة",
  title: "كل ما تحتاج معرفته قبل ما نبدأ",
  subtitle: "لم تجد إجابتك؟ راسلني مباشرة وسأرد عليك بكل سرور.",
  items: [
    {
      q: "ما الخدمات التي تقدمها في تصميم المتاجر؟",
      a: "أقدّم تصميم واجهات المتاجر الإلكترونية، وتحسين تجربة المستخدم، وتخصيص الواجهات وتطويرها، ومراجعة المتاجر القائمة واقتراح التحسينات، إضافة إلى تطبيق الهوية البصرية داخل المتجر.",
    },
    {
      q: "هل تعمل على متاجر سلة؟",
      a: "نعم، متاجر سلة من أبرز المنصات التي أعمل عليها، وأصمم التجربة بما يتوافق مع إمكانات المنصة وأدوات التخصيص المتاحة فيها.",
    },
    {
      q: "هل يمكن تطوير تصميم متجر قائم؟",
      a: "بالتأكيد. أبدأ بمراجعة المتجر الحالي وتحديد نقاط التحسين في التصميم والتنظيم وسهولة الاستخدام، ثم نتفق على خطة تطوير تناسب أولوياتك.",
    },
    {
      q: "ما المعلومات المطلوبة قبل بدء المشروع؟",
      a: "نبذة عن النشاط والجمهور المستهدف، الهوية البصرية إن وجدت (الشعار، الألوان، الخطوط)، أمثلة لمتاجر تعجبك، وقائمة بالأقسام والمنتجات الرئيسية.",
    },
    {
      q: "كم يستغرق تنفيذ تصميم المتجر؟",
      a: "تختلف المدة حسب حجم المتجر ونطاق العمل. أحدد لك جدولًا زمنيًا واضحًا بعد فهم المتطلبات، مع مراحل تسليم ومراجعة متفق عليها.",
    },
    {
      q: "هل يشمل العمل تصميم الجوال؟",
      a: "نعم، تصميم تجربة الجوال جزء أساسي من كل مشروع، لأن نسبة كبيرة من العملاء يتسوقون من هواتفهم.",
    },
    {
      q: "كيف تتم مراجعة واعتماد التصميم؟",
      a: "أشارك التصاميم على مراحل، وتستطيع إضافة ملاحظاتك مباشرة. نعدّل وفق جولات مراجعة متفق عليها حتى الاعتماد النهائي قبل التنفيذ.",
    },
    {
      q: "كيف يمكن التواصل لطلب الخدمة؟",
      a: "أسهل طريقة هي التواصل عبر واتساب من زر «ابدأ مشروعك»، أو عبر البريد الإلكتروني. سأرد عليك لنحدد موعدًا ونتعرف على مشروعك.",
    },
  ],
};

/* ─────────────────────────────── Final CTA ─────────────────────────────── */

export const finalCta = {
  title: "متجرك يستحق تجربة مختلفة",
  text: "سواء كنت تبدأ مشروعك أو تطور متجرك الحالي، ابدأ بمراجعة مجانية: ترسل رابط متجرك، وأرسل لك أهم فرص التحسين في الواجهة وتجربة الشراء.",
  primary: "احجز مراجعتك المجانية",
  secondary: "استعرض أعمالي",
  /** Short honest scarcity note. Edit or set to "" to hide. */
  note: "أستقبل عددًا محدودًا من المشاريع كل شهر حتى أعطي كل متجر حقه من الاهتمام.",
};

/* ─────────────────────────────── Footer ─────────────────────────────── */

export const footer = {
  description:
    "مصمم متاجر إلكترونية ومتخصص في تجربة المستخدم، أساعد العلامات التجارية في السعودية والخليج على بناء متاجر واضحة وجميلة وسهلة الشراء.",
  pages: [
    { label: "الرئيسية", href: "/" },
    { label: "من أنا", href: "/about/" },
    { label: "خدماتي", href: "/services/" },
    { label: "أعمالي", href: "/work/" },
    { label: "خبراتي", href: "/expertise/" },
    { label: "تواصل معي", href: "/contact/" },
  ],
  services: [
    { label: "تصميم المتاجر", href: "/services/#service-store-design" },
    { label: "تجربة المستخدم", href: "/services/#service-ux" },
    { label: "تطوير الواجهات", href: "/services/#service-development" },
    { label: "تحسين المتاجر", href: "/services/#service-improvement" },
    { label: "الباقات", href: "/#packages" },
  ],
};

/* ─────────────────────────── Inner page headers ─────────────────────────── */

export const pages = {
  about: {
    title: "من أنا",
    heading: "مصمم يفهم التجارة قبل أن يفتح برنامج التصميم",
    text: "تعرّف على طريقتي في العمل، وما الذي يجعل المتجر الذي أصممه مختلفًا عن القوالب الجاهزة.",
  },
  services: {
    title: "خدماتي",
    heading: "كل ما يحتاجه متجرك ليبيع بثقة",
    text: "من تصميم متجر جديد إلى تطوير متجر قائم: خدمات مصممة حول هدف واحد، أن يجد عميلك ما يريد ويشتريه بسهولة.",
  },
  work: {
    title: "أعمالي",
    heading: "أعمال تحكي تفاصيل التجربة",
    text: "نماذج من المتاجر والتجارب الرقمية، مع شرح للأهداف ومنهجية التصميم في كل مشروع.",
  },
  expertise: {
    title: "خبراتي",
    heading: "منهجية واضحة وأدوات احترافية",
    text: "كيف أفكر في تجربة العميل داخل المتجر، والأدوات التي أعتمد عليها لتحويل الفكرة إلى واجهة تعمل.",
  },
  contact: {
    title: "تواصل معي",
    heading: "خلّنا نتكلم عن متجرك",
    text: "اكتب لي عن مشروعك وسأرد عليك بخطوة واضحة تالية. المراجعة الأولى مجانية وبدون أي التزام.",
  },
};

/* ─────────────────────────── Home (sales page) ─────────────────────────── */
// Marketing copy for the homepage. Every block is editable.
// ⚠️ Review the package contents (revision rounds, support period) so they
// match what you actually offer before publishing.

export const home = {
  problems: {
    eyebrow: "هل يبدو هذا مألوفًا؟",
    title: "زوار يدخلون متجرك… ثم يخرجون بدون طلب",
    subtitle: "في أغلب الحالات يكون المنتج جيدًا، والذي يحتاج إلى تطوير هو طريقة عرضه ورحلة شرائه.",
    items: [
      { title: "زيارات كثيرة وطلبات قليلة", text: "العميل يتصفح المنتجات ويغادر دون أن يضيف شيئًا إلى السلة." },
      { title: "سلات متروكة", text: "خطوات مربكة أو معلومات ناقصة تجعل العميل يتردد في اللحظة الأخيرة." },
      { title: "متجر يشبه غيره", text: "قالب مكرر لا يعكس قيمة منتجك ولا يبرّر سعره أمام المنافسين." },
      { title: "تجربة جوال مرهقة", text: "أغلب عملائك يتسوقون من الجوال، وكل صعوبة هناك تعني طلبًا ضائعًا." },
    ],
  },
  outcomes: {
    eyebrow: "الحل",
    title: "متجر مصمم ليبيع، لا ليبدو جميلًا فقط",
    subtitle: "أبني تصميم متجرك حول قرار الشراء: ماذا يحتاج العميل أن يرى، وأن يفهم، وأن يطمئن له قبل أن يضغط «أضف للسلة».",
    items: [
      { title: "ثقة من أول نظرة", text: "هوية واضحة وواجهة احترافية تطمئن العميل أنه في المكان الصحيح." },
      { title: "طريق أقصر للشراء", text: "أقسام منطقية وصفحات منتجات تجيب عن أسئلة العميل وتقوده إلى السلة." },
      { title: "تجربة جوال سلسة", text: "أصمم للجوال أولًا، ثم أوسّع التجربة للشاشات الأكبر." },
      { title: "متجر سهل الإدارة", text: "مكونات منظمة تستطيع تحديثها وإضافة منتجاتها بدون تعقيد." },
    ],
  },
  process: {
    eyebrow: "كيف نعمل معًا",
    title: "أربع خطوات واضحة من أول رسالة إلى إطلاق متجرك",
    steps: [
      { title: "مراجعة مجانية", text: "ترسل رابط متجرك أو فكرتك، وأرسل لك ملاحظات عملية على أهم فرص التحسين." },
      { title: "خطة وعرض سعر", text: "نحدد النطاق والأولويات والجدول الزمني والسعر بوضوح قبل أن نبدأ." },
      { title: "تصميم ومراجعات", text: "أشاركك التصاميم على مراحل، وتضيف ملاحظاتك في جولات مراجعة متفق عليها." },
      { title: "إطلاق ومتابعة", text: "أجهّز الواجهة على المنصة، وأتابع معك بعد الإطلاق لضبط أي تفاصيل." },
    ],
  },
  packages: {
    eyebrow: "الباقات",
    title: "اختر نقطة البداية المناسبة لمتجرك",
    subtitle: "كل باقة قابلة للتخصيص حسب نشاطك. السعر النهائي يتحدد بعد المراجعة المجانية ومعرفة نطاق العمل.",
    /** Leave `price` empty to show "حسب نطاق المشروع". */
    items: [
      {
        name: "انطلاقة",
        for: "لمتجر جديد يحتاج بداية احترافية",
        price: "",
        featured: false,
        features: [
          "تصميم الصفحة الرئيسية وصفحة المنتج وصفحة التصنيف",
          "تطبيق هويتك البصرية على المتجر",
          "تصميم متجاوب للجوال والتابلت",
          "جولتا مراجعة على التصميم",
        ],
        cta: "ابدأ بهذه الباقة",
      },
      {
        name: "نمو",
        for: "لعلامة تريد متجرًا متكاملًا يبيع بثقة",
        price: "",
        featured: true,
        badge: "الخيار الأنسب لأغلب المتاجر",
        features: [
          "تصميم كامل لصفحات المتجر الأساسية",
          "تخطيط رحلة الشراء من الرئيسية حتى الدفع",
          "تخصيص الواجهة على المنصة وتنفيذها",
          "ثلاث جولات مراجعة",
          "متابعة لمدة 30 يومًا بعد الإطلاق",
        ],
        cta: "اطلب عرض سعر",
      },
      {
        name: "تطوير متجر قائم",
        for: "لمتجر يعمل ويحتاج تحسين تجربته",
        price: "",
        featured: false,
        features: [
          "مراجعة شاملة للواجهة وتجربة الشراء",
          "تقرير بفرص التحسين مرتبة حسب الأولوية",
          "تنفيذ التحسينات الأهم على المتجر",
          "مقارنة قبل وبعد لما تم تطويره",
        ],
        cta: "ابدأ بالمراجعة",
      },
    ],
  },
  comparison: {
    eyebrow: "لماذا تصميم مخصص؟",
    title: "الفرق بين قالب جاهز ومتجر مصمم لعلامتك",
    columns: ["قالب جاهز", "تصميم مخصص مع عوض"],
    rows: [
      { label: "يعكس شخصية علامتك وقيمة منتجك", a: "partial", b: "yes" },
      { label: "رحلة شراء مدروسة لنوع نشاطك", a: "no", b: "yes" },
      { label: "صفحات منتج تجيب عن أسئلة عميلك", a: "partial", b: "yes" },
      { label: "تجربة مصممة للجوال أولًا", a: "partial", b: "yes" },
      { label: "مختلف عن متاجر منافسيك", a: "no", b: "yes" },
      { label: "متابعة وتعديل بعد الإطلاق", a: "no", b: "yes" },
    ] as { label: string; a: "yes" | "no" | "partial"; b: "yes" | "no" | "partial" }[],
  },
  commitment: {
    eyebrow: "التزامي معك",
    title: "وضوح من أول يوم، بدون مفاجآت",
    items: [
      { title: "نطاق وسعر واضحان", text: "تعرف بالضبط ماذا ستستلم وكم ستدفع قبل البدء." },
      { title: "مراحل تسليم محددة", text: "جدول زمني متفق عليه، وتحديثات منتظمة في كل مرحلة." },
      { title: "ملفات ومصادر كاملة", text: "تستلم ملفات التصميم كاملة، فالمتجر وتصميمه ملكك." },
      { title: "متابعة بعد الإطلاق", text: "لا ينتهي دوري عند التسليم، أتابع معك حتى يستقر كل شيء." },
    ],
  },
  work: {
    eyebrow: "من أعمالي",
    title: "شاهد كيف أفكر في كل متجر",
    subtitle: "لكل مشروع صفحة تشرح الهدف ومنهجية التصميم والواجهات على مختلف الشاشات.",
    cta: "كل الأعمال",
  },
  faq: {
    extra: [
      {
        q: "لم أحدد ميزانيتي بعد، هل أستطيع التواصل؟",
        a: "بالتأكيد. المراجعة المجانية تساعدك تعرف ما يحتاجه متجرك فعلًا، وبعدها أقترح عليك الخيار المناسب لميزانيتك.",
      },
      {
        q: "ماذا لو لم يعجبني التصميم؟",
        a: "نبدأ بفهم ذوقك وأمثلة تعجبك قبل التصميم، ثم نمر بجولات مراجعة متفق عليها حتى نصل إلى نتيجة تناسبك.",
      },
      {
        q: "هل تقدم كتابة المحتوى وتصوير المنتجات؟",
        a: "تركيزي على التصميم وتجربة المستخدم، وأوجّهك لتجهيز الصور والنصوص بالشكل الذي يخدم التصميم.",
      },
    ],
  },
};
