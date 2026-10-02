import path from "node:path";
import { JsonFileRepository } from "./json-store";
import type { Repository } from "./repository";
import { seedDemo } from "./seed";

export type { Repository } from "./repository";

const g = globalThis as unknown as { __abayaRepo?: Promise<Repository> };

export const DEFAULT_STORE = process.env.DEFAULT_STORE_ID ?? "demo";

async function init(): Promise<Repository> {
  const file = process.env.DATA_FILE === "memory" ? null : path.resolve(process.env.DATA_FILE ?? "data/db.json");
  const repo = new JsonFileRepository(file);
  if (repo.isEmpty && process.env.SEED_DEMO !== "0") {
    await seedDemo(repo, DEFAULT_STORE);
    repo.flush();
  }
  return repo;
}

/** Process-wide repository singleton (survives Next.js dev HMR). */
export function getRepo(): Promise<Repository> {
  g.__abayaRepo ??= init();
  return g.__abayaRepo;
}
