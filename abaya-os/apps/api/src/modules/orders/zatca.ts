/**
 * ZATCA (Fatoora) Phase-1 simplified tax invoice QR: TLV-encoded, base64.
 * Tags: 1 seller name, 2 VAT number, 3 timestamp (ISO 8601), 4 invoice total (with VAT), 5 VAT total.
 * Phase-2 (integration with the Fatoora platform, cryptographic stamps) is NOT implemented.
 */
export function zatcaQr(fields: { sellerName: string; vatNumber: string; timestamp: Date; total: number; vatTotal: number }): string {
  const tlv = (tag: number, value: string) => {
    const v = Buffer.from(value, 'utf8');
    if (v.length > 255) throw new Error('TLV value too long');
    return Buffer.concat([Buffer.from([tag, v.length]), v]);
  };
  return Buffer.concat([
    tlv(1, fields.sellerName),
    tlv(2, fields.vatNumber),
    tlv(3, fields.timestamp.toISOString()),
    tlv(4, (fields.total / 100).toFixed(2)),
    tlv(5, (fields.vatTotal / 100).toFixed(2)),
  ]).toString('base64');
}

export function decodeTlv(b64: string): Record<number, string> {
  const buf = Buffer.from(b64, 'base64');
  const out: Record<number, string> = {};
  let i = 0;
  while (i < buf.length) {
    const tag = buf[i];
    const len = buf[i + 1];
    out[tag] = buf.subarray(i + 2, i + 2 + len).toString('utf8');
    i += 2 + len;
  }
  return out;
}
