import type { DesignConfig } from "./engine/types";
import type { PriceBreakdown } from "./engine/pricing";
import type { SizeInput } from "./engine/size";

export type DesignStatus = "draft" | "saved" | "in_cart" | "ordered";

export interface DesignImage {
  view: "front" | "back" | "side";
  url: string;
  provider: string;
  illustrative: boolean;
}

export interface SavedDesign {
  id: string;
  /** Public code, e.g. AB10294 */
  code: string;
  storeId: string;
  config: DesignConfig;
  sku: string;
  price: PriceBreakdown;
  size?: { size: string; confidence: string; summary: string; input?: SizeInput } | null;
  images: DesignImage[];
  prompt?: string;
  status: DesignStatus;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
  cartAddedAt?: string;
  orderedAt?: string;
}

export interface CartItem {
  id: string;
  designCode: string;
  size: string;
  quantity: number;
  unitPrice: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  storeId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Order {
  id: string;
  number: string;
  storeId: string;
  cartId: string;
  items: CartItem[];
  total: number;
  createdAt: string;
}

export interface ProductComponent {
  group: string;
  optionId: string;
  name: string;
  sku: string;
  price: number;
}

export interface ProductTemplate {
  id: string;
  storeId: string;
  sourceDesignCode: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  sku: string;
  sizes: string[];
  components: ProductComponent[];
  config: DesignConfig;
  leadTimeDays: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface OtpRecord {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

export interface Merchant {
  email: string;
  storeId: string;
  name: string;
}
