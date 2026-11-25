import type { ImageJobType } from '@prisma/client';

/**
 * Adapter contract for AI image providers (background removal, model try-on, lifestyle scenes,
 * colour variants). ABAYA OS ships NO adapter: no image provider is bundled or claimed.
 * To add one, implement this interface, register it in IMAGE_ADAPTERS, and give the
 * IMAGE_GENERATION integration a real `verify` in integrations/providers.ts.
 */
export interface ImageProviderAdapter {
  readonly name: string;
  supports(type: ImageJobType): boolean;
  /** Returns the generated image bytes (PNG/JPEG/WebP). */
  run(input: { type: ImageJobType; source: Buffer; sourceContentType: string; prompt?: string | null; credentials: Record<string, string> }): Promise<Buffer>;
}

export const IMAGE_ADAPTERS: ImageProviderAdapter[] = [];
