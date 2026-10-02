/**
 * File storage boundary. Local disk for development; swap for S3 / GCS /
 * Cloudflare R2 by implementing the same two functions.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.env.UPLOAD_DIR ?? "data/uploads");
const NAME = /^[a-z0-9_-]{4,64}\.(png|jpg|webp)$/;

export async function putFile(name: string, bytes: Uint8Array): Promise<string> {
  if (!NAME.test(name)) throw new Error("invalid file name");
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(path.join(ROOT, name), bytes);
  return `/api/files/${name}`;
}

export async function getFile(name: string): Promise<Uint8Array | null> {
  if (!NAME.test(name)) return null;
  try {
    return await fs.readFile(path.join(ROOT, name));
  } catch {
    return null;
  }
}
