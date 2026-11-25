import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  const c = new CryptoService();
  it('round-trips AES-256-GCM and detects tampering', () => {
    const enc = c.encrypt('{"apiKey":"secret"}');
    expect(enc).not.toContain('secret');
    expect(c.decrypt(enc)).toBe('{"apiKey":"secret"}');
    const parts = enc.split('.');
    parts[2] = Buffer.from('tampered').toString('base64');
    expect(() => c.decrypt(parts.join('.'))).toThrow();
  });
});
