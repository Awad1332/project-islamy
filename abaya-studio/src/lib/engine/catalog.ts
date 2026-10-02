import type { DesignOption, OptionGroup, StoreCatalog } from "./types";

type Seed = Omit<DesignOption, "id" | "group" | "incompatibleWith" | "compatibleWith" | "sortOrder" | "available" | "leadTimeDays"> &
  Partial<Pick<DesignOption, "incompatibleWith" | "compatibleWith" | "available" | "leadTimeDays">>;

function group(g: OptionGroup, seeds: Seed[]): DesignOption[] {
  return seeds.map((s, i) => ({
    available: true,
    leadTimeDays: 0,
    incompatibleWith: [],
    compatibleWith: [],
    ...s,
    id: `${g}.${s.code}`,
    group: g,
    sortOrder: i,
  }));
}

/** Demo catalog: a realistic starting point a merchant edits from the dashboard. */
export function createDemoCatalog(storeId = "demo"): StoreCatalog {
  const options: DesignOption[] = [
    ...group("cut", [
      { code: "wide", name: "واسعة", nameEn: "wide-cut", description: "قصة مريحة وانسيابية.", price: 0, sku: "CUT-WID", prompt: "loose wide-cut flowing" },
      { code: "straight", name: "مستقيمة", nameEn: "straight-cut", description: "خطوط نظيفة وأنيقة.", price: 0, sku: "CUT-STR", prompt: "straight-cut tailored column" },
      { code: "aline", name: "A-Line", nameEn: "A-line", description: "تتسع بلطف نحو الأسفل.", price: 0, sku: "CUT-ALN", prompt: "A-line gently flaring" },
      { code: "cloche", name: "كلوش", nameEn: "cloche", description: "حركة دائرية عند المشي.", price: 30, sku: "CUT-CLO", prompt: "full circle cloche flared", leadTimeDays: 1 },
      {
        code: "bisht", name: "بشت", nameEn: "bisht-style", description: "طابع ملكي بطبقة خارجية.", price: 60, sku: "CUT-BSH",
        prompt: "bisht-style cloak with an open front outer layer over a matching inner dress", leadTimeDays: 2,
        compatibleWith: ["closure.open", "closure.snaps"],
      },
      { code: "custom", name: "قصة خاصة", nameEn: "bespoke-cut", description: "تفصيل حسب رغبتك مع المصممة.", price: 90, sku: "CUT-CUS", prompt: "bespoke asymmetric couture", leadTimeDays: 4 },
    ]),
    ...group("length", [130, 135, 140, 145, 150].map((cm) => ({
      code: String(cm), name: `${cm} سم`, nameEn: `${cm} cm`, description: "", price: 0, sku: `LEN-${cm}`, visual: { cm },
    }))),
    ...group("sleeve", [
      { code: "regular", name: "عادي", nameEn: "classic sleeves", description: "كم كلاسيكي مريح.", price: 0, sku: "SLV-REG" },
      { code: "wide", name: "واسع", nameEn: "wide sleeves", description: "اتساع ناعم عند المعصم.", price: 0, sku: "SLV-WID" },
      { code: "flare", name: "كلوش", nameEn: "flared bell sleeves", description: "كم منساب على شكل جرس.", price: 20, sku: "SLV-FLR" },
      { code: "embroidered", name: "مطرز", nameEn: "embroidered sleeves", description: "تطريز على أطراف الكم.", price: 45, sku: "SLV-EMB", leadTimeDays: 1, incompatibleWith: ["extra.sleeve_detail"] },
      { code: "straight", name: "مستقيم", nameEn: "slim straight sleeves", description: "كم ضيق وعملي.", price: 0, sku: "SLV-STR" },
      { code: "statement", name: "كم مميز", nameEn: "statement cape sleeves", description: "كم بطبقتين بطابع فاخر.", price: 40, sku: "SLV-STM", leadTimeDays: 1 },
    ]),
    ...group("neckline", [
      { code: "round", name: "دائري", nameEn: "round neckline", description: "", price: 0, sku: "NCK-RND" },
      { code: "v", name: "V", nameEn: "V neckline", description: "", price: 0, sku: "NCK-V" },
      { code: "square", name: "مربع", nameEn: "square neckline", description: "", price: 0, sku: "NCK-SQR" },
      { code: "collar", name: "ياقة", nameEn: "shirt collar", description: "", price: 15, sku: "NCK-COL" },
      { code: "collarless", name: "بدون ياقة", nameEn: "collarless boat neckline", description: "", price: 0, sku: "NCK-NON" },
    ]),
    ...group("closure", [
      { code: "open", name: "مفتوحة", nameEn: "open front", description: "تُلبس فوق الملابس بسهولة.", price: 0, sku: "CLS-OPN" },
      { code: "buttons", name: "أزرار", nameEn: "front buttons", description: "أزرار مخفية بأناقة.", price: 15, sku: "CLS-BTN" },
      { code: "zipper", name: "سحاب", nameEn: "concealed front zipper", description: "إغلاق سريع ومرتب.", price: 10, sku: "CLS-ZIP" },
      { code: "snaps", name: "كباسين", nameEn: "hidden snap buttons", description: "كباسين خفية.", price: 10, sku: "CLS-SNP" },
      { code: "belt", name: "حزام", nameEn: "wrap closure with a tie belt", description: "لفّة بحزام عند الخصر.", price: 25, sku: "CLS-BLT", incompatibleWith: ["extra.belt"] },
    ]),
    ...group("fabric", [
      { code: "crepe", name: "كريب", nameEn: "crepe", description: "مطفي وعملي للاستخدام اليومي.", price: 0, sku: "FAB-CRP", visual: { texture: "matte" }, prompt: "matte crepe fabric" },
      { code: "nida", name: "نيدو", nameEn: "nida", description: "ناعم وخفيف بانسدال جميل.", price: 20, sku: "FAB-NDA", visual: { texture: "soft" }, prompt: "soft lightweight nida fabric with fluid drape" },
      { code: "silk", name: "حرير", nameEn: "silk", description: "لمعة هادئة للمناسبات.", price: 120, sku: "FAB-SLK", visual: { texture: "satin" }, prompt: "luxurious silk with a subtle sheen", leadTimeDays: 1 },
      { code: "linen", name: "كتان", nameEn: "linen", description: "طبيعي ومناسب للصيف.", price: 40, sku: "FAB-LIN", visual: { texture: "linen" }, prompt: "natural linen with visible fine weave texture", incompatibleWith: ["embroidery.pearl"] },
      { code: "chiffon", name: "شيفون بطبقتين", nameEn: "layered chiffon", description: "طبقة شفافة فوق بطانة.", price: 35, sku: "FAB-CHF", visual: { texture: "sheer" }, prompt: "two-layer chiffon over an opaque lining" },
    ]),
    ...group("color", [
      { code: "black", name: "أسود", nameEn: "black", description: "", price: 0, sku: "CLR-BLK", visual: { hex: "#141414", sheen: 0.6 } },
      { code: "matte_black", name: "أسود مطفي", nameEn: "matte black", description: "", price: 0, sku: "CLR-MBK", visual: { hex: "#1f1e1d", sheen: 0.15 } },
      { code: "brown", name: "بني", nameEn: "deep brown", description: "", price: 0, sku: "CLR-BRN", visual: { hex: "#4b3428", sheen: 0.45 } },
      { code: "beige", name: "بيج", nameEn: "warm beige", description: "", price: 0, sku: "CLR-BEG", visual: { hex: "#cdb79c", sheen: 0.4 } },
      { code: "grey", name: "رمادي", nameEn: "charcoal grey", description: "", price: 0, sku: "CLR-GRY", visual: { hex: "#5f5d5b", sheen: 0.4 } },
      { code: "navy", name: "كحلي", nameEn: "midnight navy", description: "", price: 0, sku: "CLR-NVY", visual: { hex: "#1d2433", sheen: 0.5 } },
      { code: "olive", name: "زيتي", nameEn: "olive", description: "", price: 10, sku: "CLR-OLV", visual: { hex: "#4d4b36", sheen: 0.4 } },
      { code: "burgundy", name: "عنابي", nameEn: "burgundy", description: "", price: 10, sku: "CLR-BUR", visual: { hex: "#4a1c24", sheen: 0.5 }, available: false },
    ]),
    ...group("embroidery", [
      { code: "none", name: "بدون تطريز", nameEn: "no embroidery", description: "بساطة نظيفة.", price: 0, sku: "EMB-NON", prompt: "no embroidery, clean minimal finish" },
      { code: "gold", name: "تطريز ذهبي", nameEn: "gold embroidery", description: "خيوط ذهبية على الأطراف.", price: 80, sku: "EMB-GLD", visual: { thread: "#c9a45c" }, prompt: "fine gold thread embroidery along the front edges, hem and cuffs", leadTimeDays: 2 },
      { code: "silver", name: "تطريز فضي", nameEn: "silver embroidery", description: "لمسة فضية هادئة.", price: 70, sku: "EMB-SLV", visual: { thread: "#c4c7cc" }, prompt: "delicate silver thread embroidery along the front edges, hem and cuffs", leadTimeDays: 2 },
      { code: "tone", name: "تطريز بنفس اللون", nameEn: "tone-on-tone embroidery", description: "فخامة هادئة غير لافتة.", price: 60, sku: "EMB-TON", prompt: "subtle tone-on-tone embroidery in the same color as the fabric", leadTimeDays: 2 },
      { code: "pearl", name: "خرز لؤلؤي", nameEn: "pearl beading", description: "حبات لؤلؤ يدوية.", price: 110, sku: "EMB-PRL", visual: { thread: "#efe9dd" }, prompt: "hand-sewn small pearl beading along the front edges and cuffs", leadTimeDays: 3, incompatibleWith: ["cut.cloche", "fabric.chiffon"] },
    ]),
    ...group("extra", [
      { code: "belt", name: "حزام", nameEn: "matching belt", description: "يحدد الخصر بلطف.", price: 35, sku: "EXT-BLT", prompt: "a matching fabric belt at the waist" },
      { code: "pockets", name: "جيوب", nameEn: "side pockets", description: "جيوب جانبية مخفية.", price: 20, sku: "EXT-PKT", prompt: "discreet side pockets" },
      { code: "cuffs", name: "أساور", nameEn: "contrast cuffs", description: "أساور مميزة عند المعصم.", price: 30, sku: "EXT-CUF", prompt: "structured contrast cuffs", incompatibleWith: ["sleeve.flare"] },
      { code: "sleeve_detail", name: "أكمام مميزة", nameEn: "sleeve detailing", description: "شريط زخرفي على الكم.", price: 40, sku: "EXT-SLD", prompt: "decorative band detailing on the upper sleeves" },
      { code: "hem_trim", name: "تفاصيل على الأطراف", nameEn: "hem trim", description: "شريط أنيق على الذيل.", price: 45, sku: "EXT-HEM", prompt: "an elegant trim band along the hem", leadTimeDays: 1 },
    ]),
  ];

  return {
    storeId,
    storeName: "دار لُجين للعبايات",
    currency: "SAR",
    basePrice: 249,
    baseLeadTimeDays: 5,
    options,
    sizeChart: [
      { size: "52", lengthCm: 132, bustCm: 112, minHeight: 148, maxHeight: 155 },
      { size: "54", lengthCm: 137, bustCm: 116, minHeight: 155, maxHeight: 160 },
      { size: "56", lengthCm: 142, bustCm: 120, minHeight: 160, maxHeight: 166 },
      { size: "58", lengthCm: 147, bustCm: 124, minHeight: 166, maxHeight: 172 },
      { size: "60", lengthCm: 152, bustCm: 128, minHeight: 172, maxHeight: 180 },
    ],
    sizeRules: {
      heightToLengthRatio: 0.86,
      heelAddCm: 4,
      cutLengthAdjust: { wide: -1, bisht: -2, cloche: 0, aline: 0, straight: 1, custom: 0 },
    },
    updatedAt: new Date(0).toISOString(),
  };
}
