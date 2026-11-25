import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { env } from '../config/env';

@Injectable()
export class CryptoService {
  private key(): Buffer {
    return Buffer.from(env().ENCRYPTION_KEY, 'hex');
  }

  /** AES-256-GCM. Output: base64(iv).base64(tag).base64(ciphertext) */
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join('.');
  }

  decrypt(payload: string): string {
    const [iv, tag, ct] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', this.key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  }

  sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }

  hmac(secret: string, body: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  }
}
