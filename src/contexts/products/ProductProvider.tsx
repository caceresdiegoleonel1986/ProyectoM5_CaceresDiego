import { useReducer, useCallback, useRef, type ReactNode } from "react";
import { ProductContext } from "./ProductContext";
import { productReducer } from "./ProductReducer";
import type { ProductState } from "./ProductContext.types";
import type { Product } from "../../types/product.types";
import type { DocumentSnapshot } from "firebase/firestore";
import {
  getDocs,
  query,
  collection,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { ProductQueryParams } from "./ProductQueryParams.types";

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  lastDoc: null,
  hasMore: true,
  loadingMore: false,
};

export function ProductProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(productReducer, initialState);
  const currentParamsRef = useRef<{ categoryId?: string | null; searchPrefix?: string }>({});

  const setProducts = useCallback((products: Product[]) =>
    dispatch({ type: "SET_PRODUCTS", payload: products }), []);

  const addProduct = useCallback((product: Product) =>
    dispatch({ type: "ADD_PRODUCT", payload: product }), []);

  const removeProduct = useCallback((id: string) =>
    dispatch({ type: "REMOVE_PRODUCT", payload: id }), []);

  const updateProduct = useCallback((product: Product) =>
    dispatch({ type: "UPDATE_PRODUCT", payload: product }), []);

  const setLoading = useCallback((loading: boolean) =>
    dispatch({ type: "SET_LOADING", payload: loading }), []);

  const setError = useCallback((error: string | null) =>
    dispatch({ type: "SET_ERROR", payload: error }), []);

  const setLastDoc = useCallback((doc: DocumentSnapshot | null) =>
    dispatch({ type: "SET_LAST_DOC", payload: doc }), []);

  const setHasMore = useCallback((hasMore: boolean) =>
    dispatch({ type: "SET_HAS_MORE", payload: hasMore }), []);

  const setLoadingMore = useCallback((loading: boolean) =>
    dispatch({ type: "SET_LOADING_MORE", payload: loading }), []);

  const fetchProducts = useCallback(async (params: ProductQueryParams) => {
    try {
      if (params.cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let q = query(collection(db, "products"));

      if (params.categoryId) {
        q = query(q, where("categoryId", "==", params.categoryId));
      }

      if (params.searchPrefix) {
        q = query(
          q,
          orderBy("nameLower"),
          startAt(params.searchPrefix),
          endAt(params.searchPrefix + "\uf8ff")
        );
      }

      if (params.cursor) {
        q = query(q, startAfter(params.cursor));
      }

      const pageSize = params.pageSize ?? 20;
      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);

      const items = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );

      if (params.cursor) {
        dispatch({ type: "SET_PRODUCTS", payload: [...state.products, ...items] });
      } else {
        dispatch({ type: "SET_PRODUCTS", payload: items });
      }

      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      setLastDoc(lastDoc);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (err) {
      console.error(err);
      setError("Error cargando productos");
    } finally {
      if (params.cursor) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [state.products, setLoadingMore, setLoading, setLastDoc, setHasMore, setError]);

  const loadFirstPage = useCallback(async (params?: { categoryId?: string | null; searchPrefix?: string }) => {
    currentParamsRef.current = params || {};
    await fetchProducts({
      categoryId: params?.categoryId ?? undefined,
      searchPrefix: params?.searchPrefix,
      pageSize: 20,
    });
  }, [fetchProducts]);

  const loadMore = useCallback(async () => {
    if (!state.lastDoc || !state.hasMore || state.loadingMore) return;
    await fetchProducts({
      categoryId: currentParamsRef.current.categoryId ?? undefined,
      searchPrefix: currentParamsRef.current.searchPrefix,
      cursor: state.lastDoc,
      pageSize: 20,
    });
  }, [fetchProducts, state.lastDoc, state.hasMore, state.loadingMore]);

  return (
    <ProductContext.Provider
      value={{
        state,
        products: state.products,
        loading: state.loading,
        error: state.error,
        lastDoc: state.lastDoc,
        hasMore: state.hasMore,
        loadingMore: state.loadingMore,
        setProducts,
        addProduct,
        removeProduct,
        updateProduct,
        setLoading,
        setError,
        setLastDoc,
        setHasMore,
        setLoadingMore,
        fetchProducts,
        loadFirstPage,
        loadMore,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export default ProductProvider;