import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { productConverter } from "../../services/converters/productConverter";
import type { Product } from "../../types/product.types";

const productsCollection = collection(db, "products").withConverter(productConverter);

type CatalogPageState = {
  queryKey: string;
  firstPage: QueryDocumentSnapshot<Product>[];
  nextPages: QueryDocumentSnapshot<Product>[];
  hasMore: boolean;
};

type RequestState = {
  queryKey: string;
  loadingMore: boolean;
  error: string | null;
};

export function useProductsRealtime(
  categoryId?: string,
  searchPrefix?: string,
  pageSize = 20,
) {
  const normalizedCategory = categoryId || "";
  const normalizedSearch = searchPrefix || "";
  const queryKey = JSON.stringify([normalizedCategory, normalizedSearch, pageSize]);
  const [pageState, setPageState] = useState<CatalogPageState>({
    queryKey: "",
    firstPage: [],
    nextPages: [],
    hasMore: true,
  });
  const [requestState, setRequestState] = useState<RequestState>({
    queryKey: "",
    loadingMore: false,
    error: null,
  });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const pendingQueryRef = useRef<string | null>(null);

  const buildQuery = useCallback((cursor?: QueryDocumentSnapshot<Product>) => {
    const constraints: QueryConstraint[] = [];
    if (normalizedCategory) constraints.push(where("categoryId", "==", normalizedCategory));
    constraints.push(orderBy("nameLower"));
    if (normalizedSearch) {
      constraints.push(where("nameLower", ">=", normalizedSearch));
      constraints.push(where("nameLower", "<=", `${normalizedSearch}\uf8ff`));
    }
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));
    return query(productsCollection, ...constraints);
  }, [normalizedCategory, normalizedSearch, pageSize]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      buildQuery(),
      (snapshot) => {
        setPageState((current) => ({
          queryKey,
          firstPage: snapshot.docs,
          nextPages: current.queryKey === queryKey ? current.nextPages : [],
          hasMore: current.queryKey === queryKey && current.nextPages.length > 0
            ? current.hasMore
            : snapshot.docs.length === pageSize,
        }));
        setRequestState({ queryKey, loadingMore: false, error: null });
      },
      (cause: Error) => {
        setRequestState({
          queryKey,
          loadingMore: false,
          error: cause.message || "No se pudieron cargar los productos.",
        });
      },
    );
    return unsubscribe;
  }, [buildQuery, pageSize, queryKey, refreshVersion]);

  const activePage = pageState.queryKey === queryKey ? pageState : null;
  const firstPage = activePage?.firstPage ?? [];
  const nextPages = activePage?.nextPages ?? [];
  const uniqueDocs = new Map<string, QueryDocumentSnapshot<Product>>();
  for (const productDoc of [...firstPage, ...nextPages]) {
    if (!uniqueDocs.has(productDoc.id)) uniqueDocs.set(productDoc.id, productDoc);
  }
  const products = [...uniqueDocs.values()].map((productDoc) => productDoc.data());
  const lastDoc = nextPages.at(-1) ?? firstPage.at(-1) ?? null;
  const hasMore = activePage?.hasMore ?? true;
  const currentRequest = requestState.queryKey === queryKey ? requestState : null;
  const loading = !activePage && !currentRequest?.error;
  const loadingMore = currentRequest?.loadingMore ?? false;
  const error = currentRequest?.error ?? null;

  const loadMore = useCallback(async () => {
    if (!activePage || !lastDoc || !hasMore || pendingQueryRef.current === queryKey) return;
    pendingQueryRef.current = queryKey;
    setRequestState({ queryKey, loadingMore: true, error: null });
    try {
      const snapshot = await getDocs(buildQuery(lastDoc));
      setPageState((current) => current.queryKey === queryKey
        ? {
            ...current,
            nextPages: [...current.nextPages, ...snapshot.docs],
            hasMore: snapshot.docs.length === pageSize,
          }
        : current);
    } catch (cause) {
      setRequestState({
        queryKey,
        loadingMore: false,
        error: cause instanceof Error ? cause.message : "No se pudieron cargar más productos.",
      });
    } finally {
      if (pendingQueryRef.current === queryKey) pendingQueryRef.current = null;
      setRequestState((current) => current.queryKey === queryKey
        ? { ...current, loadingMore: false }
        : current);
    }
  }, [activePage, buildQuery, hasMore, lastDoc, pageSize, queryKey]);

  const retry = useCallback(() => {
    setRequestState({ queryKey, loadingMore: false, error: null });
    setRefreshVersion((version) => version + 1);
  }, [queryKey]);

  return {
    products,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
    retry,
  };
}

export default useProductsRealtime;