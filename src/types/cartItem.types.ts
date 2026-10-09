import type { Product } from "./product.types";

export interface CartItem {
  product: Product;
  quantity: number;
  name?: string;
  priceAtPurchase?: number;
}