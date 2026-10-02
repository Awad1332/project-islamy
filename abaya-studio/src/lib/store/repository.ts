/**
 * Persistence boundary. Every server module talks to `Repository`, never to a
 * concrete database. The bundled adapter persists to a JSON file (zero-setup
 * for local development and demos); `db/schema.sql` describes the equivalent
 * PostgreSQL schema for a production adapter.
 */
import type { StoreCatalog } from "../engine/types";
import type { Cart, Merchant, Order, OtpRecord, ProductTemplate, SavedDesign } from "../models";

export interface Repository {
  getCatalog(storeId: string): Promise<StoreCatalog | null>;
  saveCatalog(catalog: StoreCatalog): Promise<void>;
  listStoreIds(): Promise<string[]>;

  createDesign(design: SavedDesign): Promise<SavedDesign>;
  getDesignByCode(code: string): Promise<SavedDesign | null>;
  updateDesign(code: string, patch: Partial<SavedDesign>): Promise<SavedDesign | null>;
  listDesigns(storeId: string, opts?: { limit?: number; status?: SavedDesign["status"] }): Promise<SavedDesign[]>;
  /** All designs for analytics (an adapter may stream / aggregate in SQL). */
  allDesigns(storeId: string): Promise<SavedDesign[]>;
  nextDesignNumber(): Promise<number>;

  getCart(id: string): Promise<Cart | null>;
  saveCart(cart: Cart): Promise<void>;
  createOrder(order: Order): Promise<Order>;
  listOrders(storeId: string): Promise<Order[]>;

  listProducts(storeId: string): Promise<ProductTemplate[]>;
  getProduct(id: string): Promise<ProductTemplate | null>;
  saveProduct(product: ProductTemplate): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  putOtp(rec: OtpRecord): Promise<void>;
  getOtp(email: string): Promise<OtpRecord | null>;
  deleteOtp(email: string): Promise<void>;
  getMerchant(email: string): Promise<Merchant | null>;
  saveMerchant(m: Merchant): Promise<void>;
}
