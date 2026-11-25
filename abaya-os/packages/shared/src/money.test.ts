import { describe, expect, it } from 'vitest';
import { computeTotals, splitGross } from './money';
import { hasPermission, assignableRoles } from './permissions';

describe('VAT', () => {
  it('splits a VAT-inclusive 115 SAR into 100 + 15', () => {
    expect(splitGross(11500, 1500)).toEqual({ net: 10000, vat: 1500 });
  });
  it('computes VAT-exclusive totals with shipping', () => {
    const t = computeTotals([{ unitPrice: 30000, quantity: 2 }], 2500, { vatEnabled: true, vatRateBps: 1500, pricesIncludeVat: false });
    expect(t.subtotal).toBe(60000);
    expect(t.vatTotal).toBe(9000 + 375);
    expect(t.total).toBe(60000 + 9000 + 2500 + 375);
  });
  it('computes VAT-inclusive totals with order discount', () => {
    const t = computeTotals([{ unitPrice: 46000, quantity: 1 }], 0, { vatEnabled: true, vatRateBps: 1500, pricesIncludeVat: true }, 11500);
    expect(t.total).toBe(34500);
    expect(t.vatTotal).toBe(4500);
    expect(t.subtotal).toBe(30000);
  });
  it('zero VAT when disabled', () => {
    const t = computeTotals([{ unitPrice: 10000, quantity: 1 }], 0, { vatEnabled: false, vatRateBps: 1500, pricesIncludeVat: false });
    expect(t.vatTotal).toBe(0);
    expect(t.total).toBe(10000);
  });
});

describe('RBAC', () => {
  it('support cannot write catalog; manager can', () => {
    expect(hasPermission('SUPPORT', 'catalog:write')).toBe(false);
    expect(hasPermission('MANAGER', 'catalog:write')).toBe(true);
    expect(hasPermission('ADMIN', 'billing:manage')).toBe(false);
  });
  it('prevents role escalation', () => {
    expect(assignableRoles('ADMIN')).not.toContain('OWNER');
    expect(assignableRoles('ADMIN')).not.toContain('ADMIN');
    expect(assignableRoles('STAFF')).toEqual([]);
  });
});
