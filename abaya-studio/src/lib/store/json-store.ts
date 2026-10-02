import fs from "node:fs";
import path from "node:path";
import type { StoreCatalog } from "../engine/types";
import type { Cart, Merchant, Order, OtpRecord, ProductTemplate, SavedDesign } from "../models";
import type { Repository } from "./repository";

interface DbShape {
  version: 1;
  designCounter: number;
  catalogs: Record<string, StoreCatalog>;
  designs: SavedDesign[];
  carts: Record<string, Cart>;
  orders: Order[];
  products: ProductTemplate[];
  otps: Record<string, OtpRecord>;
  merchants: Record<string, Merchant>;
}

const empty = (): DbShape => ({
  version: 1,
  designCounter: 10000,
  catalogs: {},
  designs: [],
  carts: {},
  orders: [],
  products: [],
  otps: {},
  merchants: {},
});

const clone = <T>(v: T): T => structuredClone(v);

/** Single-process JSON file store. Writes are atomic (tmp + rename). */
export class JsonFileRepository implements Repository {
  private db: DbShape;
  private byCode = new Map<string, SavedDesign>();
  private timer: NodeJS.Timeout | null = null;

  constructor(private file: string | null) {
    this.db = empty();
    if (file && fs.existsSync(file)) {
      try {
        this.db = { ...empty(), ...JSON.parse(fs.readFileSync(file, "utf8")) };
      } catch {
        console.warn(`[store] could not parse ${file}; starting empty`);
      }
    }
    for (const d of this.db.designs) this.byCode.set(d.code, d);
  }

  get isEmpty() {
    return Object.keys(this.db.catalogs).length === 0;
  }

  private persist() {
    if (!this.file) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 150);
  }

  flush() {
    if (!this.file) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db));
    fs.renameSync(tmp, this.file);
  }

  async getCatalog(storeId: string) {
    const c = this.db.catalogs[storeId];
    return c ? clone(c) : null;
  }
  async saveCatalog(catalog: StoreCatalog) {
    this.db.catalogs[catalog.storeId] = clone({ ...catalog, updatedAt: new Date().toISOString() });
    this.persist();
  }
  async listStoreIds() {
    return Object.keys(this.db.catalogs);
  }

  async createDesign(design: SavedDesign) {
    const d = clone(design);
    this.db.designs.push(d);
    this.byCode.set(d.code, d);
    this.persist();
    return clone(d);
  }
  async getDesignByCode(code: string) {
    const d = this.byCode.get(code);
    return d ? clone(d) : null;
  }
  async updateDesign(code: string, patch: Partial<SavedDesign>) {
    const d = this.byCode.get(code);
    if (!d) return null;
    Object.assign(d, clone(patch), { id: d.id, code: d.code, updatedAt: new Date().toISOString() });
    this.persist();
    return clone(d);
  }
  async listDesigns(storeId: string, opts: { limit?: number; status?: SavedDesign["status"] } = {}) {
    const out: SavedDesign[] = [];
    for (let i = this.db.designs.length - 1; i >= 0 && out.length < (opts.limit ?? 50); i--) {
      const d = this.db.designs[i];
      if (d.storeId === storeId && (!opts.status || d.status === opts.status)) out.push(d);
    }
    return clone(out);
  }
  async allDesigns(storeId: string) {
    // Read-only consumers; avoid cloning thousands of rows.
    return this.db.designs.filter((d) => d.storeId === storeId);
  }
  async nextDesignNumber() {
    this.db.designCounter += 1 + Math.floor(Math.random() * 3);
    this.persist();
    return this.db.designCounter;
  }

  async getCart(id: string) {
    const c = this.db.carts[id];
    return c ? clone(c) : null;
  }
  async saveCart(cart: Cart) {
    this.db.carts[cart.id] = clone(cart);
    this.persist();
  }
  async createOrder(order: Order) {
    this.db.orders.push(clone(order));
    this.persist();
    return order;
  }
  async listOrders(storeId: string) {
    return clone(this.db.orders.filter((o) => o.storeId === storeId).reverse());
  }

  async listProducts(storeId: string) {
    return clone(this.db.products.filter((p) => p.storeId === storeId).reverse());
  }
  async getProduct(id: string) {
    const p = this.db.products.find((x) => x.id === id);
    return p ? clone(p) : null;
  }
  async saveProduct(product: ProductTemplate) {
    const i = this.db.products.findIndex((p) => p.id === product.id);
    if (i >= 0) this.db.products[i] = clone(product);
    else this.db.products.push(clone(product));
    this.persist();
  }
  async deleteProduct(id: string) {
    this.db.products = this.db.products.filter((p) => p.id !== id);
    this.persist();
  }

  async putOtp(rec: OtpRecord) {
    this.db.otps[rec.email] = clone(rec);
    this.persist();
  }
  async getOtp(email: string) {
    const r = this.db.otps[email];
    return r ? clone(r) : null;
  }
  async deleteOtp(email: string) {
    delete this.db.otps[email];
    this.persist();
  }
  async getMerchant(email: string) {
    const m = this.db.merchants[email];
    return m ? clone(m) : null;
  }
  async saveMerchant(m: Merchant) {
    this.db.merchants[m.email] = clone(m);
    this.persist();
  }
}
