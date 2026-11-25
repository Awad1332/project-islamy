// Labels for abaya attribute vocabularies.
type L = Record<string, [string, string]>; // [ar, en]
export const ATTR_LABELS: Record<string, L> = {
  cut: { CLOSED: ['مغلقة', 'Closed'], OPEN_FRONT: ['مفتوحة من الأمام', 'Open front'], KIMONO: ['كيمونو', 'Kimono'], BUTTERFLY: ['فراشة', 'Butterfly'], BISHT: ['بشت', 'Bisht'], CAPE: ['كاب', 'Cape'], WRAP: ['لف', 'Wrap'], A_LINE: ['قصة A', 'A-line'], KAFTAN: ['قفطان', 'Kaftan'] },
  fabric: { NIDA: ['نيدا', 'Nida'], CREPE: ['كريب', 'Crepe'], CHIFFON: ['شيفون', 'Chiffon'], GEORGETTE: ['جورجيت', 'Georgette'], LINEN: ['كتان', 'Linen'], SILK: ['حرير', 'Silk'], JERSEY: ['جيرسي', 'Jersey'], ZOOM: ['زوم', 'Zoom'], KOREAN_NIDA: ['نيدا كوري', 'Korean nida'], VELVET: ['مخمل', 'Velvet'], OTHER: ['أخرى', 'Other'] },
  sleeveType: { STRAIGHT: ['مستقيمة', 'Straight'], WIDE: ['واسعة', 'Wide'], BELL: ['جرس', 'Bell'], CUFFED: ['بكفة', 'Cuffed'], BUTTERFLY: ['فراشة', 'Butterfly'], ELASTIC: ['مطاط', 'Elastic'] },
  closure: { NONE: ['بدون', 'None'], SNAPS: ['كبسات', 'Snaps'], BUTTONS: ['أزرار', 'Buttons'], ZIPPER: ['سحاب', 'Zipper'], BELT: ['حزام', 'Belt'], HIDDEN: ['مخفي', 'Hidden'] },
  embellishment: { NONE: ['بدون', 'None'], EMBROIDERY: ['تطريز', 'Embroidery'], BEADING: ['خرز', 'Beading'], LACE: ['دانتيل', 'Lace'], PIPING: ['بيبنق', 'Piping'], PRINT: ['طباعة', 'Print'], STONES: ['أحجار', 'Stones'], FEATHERS: ['ريش', 'Feathers'] },
  opacity: { OPAQUE: ['غير شفافة', 'Opaque'], SEMI_SHEER: ['شبه شفافة', 'Semi-sheer'], SHEER: ['شفافة', 'Sheer'] },
  occasions: { DAILY: ['يومي', 'Daily'], WORK: ['عمل', 'Work'], EVENING: ['سهرة', 'Evening'], WEDDING: ['أعراس', 'Wedding'], EID: ['العيد', 'Eid'], RAMADAN: ['رمضان', 'Ramadan'], TRAVEL: ['سفر', 'Travel'], UMRAH: ['عمرة', 'Umrah'] },
};
export function attrLabel(group: string, value: string | null | undefined, locale: 'ar' | 'en') {
  if (!value) return '—';
  const l = ATTR_LABELS[group]?.[value];
  return l ? l[locale === 'ar' ? 0 : 1] : value;
}
