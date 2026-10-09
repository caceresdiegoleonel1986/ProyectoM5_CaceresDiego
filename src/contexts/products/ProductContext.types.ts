import type { Product } from "../../types/product.types";
import type { DocumentSnapshot } from "firebase/firestore";

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
};