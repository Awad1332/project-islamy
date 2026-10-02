import { handler, json } from "@/lib/http";
import { checkout } from "@/lib/services/cart";
import { DEFAULT_STORE } from "@/lib/store";

export const POST = handler(async () => json(await checkout(DEFAULT_STORE), 201));
