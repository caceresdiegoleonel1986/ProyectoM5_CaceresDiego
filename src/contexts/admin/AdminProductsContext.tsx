import { createContext } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { Product } from "../../types/product.types";

export type AdminProductsContextType = {
  products: Product[];
  lastDoc: QueryDocumentSnapshot<Product> | null;
  hasMore: boolean;
  fetchProducts: (options?: {
    categoryId?: string;
    cursor?: QueryDocumentSnapshot<Product> | null;
    pageSize?: number;
  }) => Promise<void>;
  createProduct: (data: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
};

export const AdminProductsContext = createContext<AdminProductsContextType | null>(null);