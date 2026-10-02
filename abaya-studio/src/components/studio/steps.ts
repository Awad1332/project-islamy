import type { Crop } from "@/lib/render/abaya";
import type { OptionGroup } from "@/lib/engine/types";

export interface StepDef {
  key: string;
  groups: OptionGroup[];
  title: string;
  hint: string;
  art: "figure" | "swatch" | "length" | "chip";
  crop?: Crop;
  /** Where the preview should zoom to highlight this decision. */
  focus?: "full" | "upper" | "neck" | "hem";
}

export const STEPS: StepDef[] = [
  { key: "cut", groups: ["cut"], title: "اختاري القصة", hint: "القصة تحدد إحساس العباية كلها.", art: "figure", crop: "full", focus: "full" },
  { key: "length", groups: ["length"], title: "كم تحبين الطول؟", hint: "الطول من الكتف إلى الذيل.", art: "length", focus: "hem" },
  { key: "sleeve", groups: ["sleeve"], title: "شكل الأكمام", hint: "", art: "figure", crop: "sleeve", focus: "upper" },
  { key: "neckline", groups: ["neckline"], title: "شكل الرقبة", hint: "", art: "figure", crop: "neck", focus: "neck" },
  { key: "closure", groups: ["closure"], title: "طريقة الإغلاق", hint: "", art: "figure", crop: "torso", focus: "full" },
  { key: "fabric", groups: ["fabric"], title: "اختاري الخامة", hint: "المسي الفرق بعينك.", art: "swatch", focus: "full" },
  { key: "color", groups: ["color"], title: "اختاري اللون", hint: "", art: "swatch", focus: "full" },
  { key: "details", groups: ["embroidery", "extra"], title: "اللمسات الأخيرة", hint: "اختياري — أضيفي ما يعجبك.", art: "figure", crop: "torso", focus: "full" },
];
