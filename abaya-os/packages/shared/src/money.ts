/**
 * Money is stored as integer halalas (1 SAR = 100 halalas). VAT rates are basis points (1500 = 15%).
 */
export const DEFAULT_VAT_BPS = 1500;
export const CURRENCY = 'SAR';
export const TIMEZONE = 'Asia/Riyadh';

export function sarToHalalas(sar: number): number {
  return Math.round(sar * 100);
}
export function halalasToSar(h: number): number {
  return h / 100;
}

export interface VatConfig {
  vatEnabled: boolean;
  vatRateBps: number;
  pricesIncludeVat: boolean;
}

export interface LineInput {
  unitPrice: number; // halalas, as listed (gross if pricesIncludeVat)
  quantity: number;
  discount?: number; // halalas off the line total (listed basis)
}

export interface Totals {
  subtotal: number; // net of VAT, after line discounts
  discountTotal: number;
  shippingTotal: number;
  vatTotal: number;
  total: number;
  lines: { net: number; vat: number; gross: number }[];
}

/** Split a gross (VAT-inclusive) amount into net + vat, rounding VAT to the halala. */
export function splitGross(gross: number, rateBps: number): { net: number; vat: number } {
  const vat = Math.round((gross * rateBps) / (10000 + rateBps));
  return { net: gross - vat, vat };
}

export function vatOnNet(net: number, rateBps: number): number {
  return Math.round((net * rateBps) / 10000);
}

/**
 * Compute order totals. Shipping is treated like a line (taxable when VAT is enabled), following
 * ZATCA guidance that delivery charges follow the supply's VAT treatment.
 */
export function computeTotals(lines: LineInput[], shipping: number, cfg: VatConfig, orderDiscount = 0): Totals {
  const rate = cfg.vatEnabled ? cfg.vatRateBps : 0;
  const computed = lines.map((l) => {
    const listed = Math.max(0, l.unitPrice * l.quantity - (l.discount ?? 0));
    if (cfg.pricesIncludeVat) {
      const { net, vat } = splitGross(listed, rate);
      return { net, vat, gross: listed };
    }
    const vat = vatOnNet(listed, rate);
    return { net: listed, vat, gross: listed + vat };
  });
  let net = computed.reduce((s, l) => s + l.net, 0);
  let vat = computed.reduce((s, l) => s + l.vat, 0);
  // Order-level discount (listed basis), allocated before VAT.
  const disc = Math.min(orderDiscount, cfg.pricesIncludeVat ? net + vat : net);
  if (disc > 0) {
    if (cfg.pricesIncludeVat) {
      const d = splitGross(disc, rate);
      net -= d.net;
      vat -= d.vat;
    } else {
      net -= disc;
      vat = vatOnNet(net, rate);
    }
  }
  let shipNet = shipping;
  let shipVat = 0;
  if (cfg.pricesIncludeVat) {
    const s = splitGross(shipping, rate);
    shipNet = s.net;
    shipVat = s.vat;
  } else {
    shipVat = vatOnNet(shipping, rate);
  }
  const lineDiscounts = lines.reduce((s, l) => s + (l.discount ?? 0), 0);
  return {
    subtotal: net,
    discountTotal: lineDiscounts + disc,
    shippingTotal: shipNet + shipVat,
    vatTotal: vat + shipVat,
    total: net + vat + shipNet + shipVat,
    lines: computed,
  };
}

export function formatSar(halalas: number, locale: 'ar' | 'en' = 'ar'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(halalas / 100);
}

/** YYYY-MM-DD of an instant in Asia/Riyadh. */
export function riyadhDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
