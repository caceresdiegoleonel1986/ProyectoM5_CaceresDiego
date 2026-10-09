import type { Product } from "../../types/product.types";
import type { DocumentSnapshot } from "firebase/firestore";
import type { ProductQueryParams } from "./ProductQueryParams.types";

export type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  loadingMore: boolean;
};

export type ProductAction =
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "REMOVE_PRODUCT"; payload: string }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LAST_DOC"; payload: DocumentSnapshot | null }
  | { type: "SET_HAS_MORE"; payload: boolean }
  | { type: "SET_LOADING_MORE"; payload: boolean };

export type ProductContextType = {
  state: ProductState;
  products: Product[];
  loading: boolean;
  error: string | null;
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  loadingMore: boolean;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  updateProduct: (product: Product) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastDoc: (doc: DocumentSnapshot | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  fetchProducts: (params: ProductQueryParams) => Promise<void>;
  loadFirstPage: (params?: { categoryId?: string | null; searchPrefix?: string }) => Promise<void>;
  loadMore: () => Promise<void>;
};