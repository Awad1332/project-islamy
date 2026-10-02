import { getRepo, DEFAULT_STORE } from "../store";
import type { StoreCatalog } from "../engine/types";

export class NotFoundError extends Error {}
export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
  }
}

const STORE_ID = /^[a-z0-9-]{2,40}$/;

export async function loadCatalog(storeId: string | null | undefined = DEFAULT_STORE): Promise<StoreCatalog> {
  const id = storeId && STORE_ID.test(storeId) ? storeId : DEFAULT_STORE;
  const repo = await getRepo();
  const c = await repo.getCatalog(id);
  if (!c) throw new NotFoundError("المتجر غير موجود");
  return c;
}
