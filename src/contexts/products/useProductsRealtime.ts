import { useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { Product } from "../../types/product.types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(
    async ({
      categoryId,
      searchPrefix,
      cursor,
      pageSize = 20,
    }: {
      categoryId?: string;
      searchPrefix?: string;
      cursor?: DocumentSnapshot | null;
      pageSize?: number;
    } = {}) => {
      try {
        setLoading(true);

        let q = query(collection(db, "products"));

        if (categoryId) {
          q = query(q, where("categoryId", "==", categoryId));
        }

        if (searchPrefix) {
          q = query(
            q,
            orderBy("nameLower"),
            where("nameLower", ">=", searchPrefix),
            where("nameLower", "<=", searchPrefix + "\uf8ff")
          );
        } else {
          q = query(q, orderBy("nameLower"));
        }

        if (cursor) {
          q = query(q, startAfter(cursor));
        }

        q = query(q, limit(pageSize));

        const snapshot = await getDocs(q);

        const items = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...(doc.data() as Omit<Product, "id">) })
        );

        setProducts((prev) => (cursor ? [...prev, ...items] : items));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
        setHasMore(snapshot.docs.length === pageSize);
      } catch (err) {
        console.error(err);
        setError("Error cargando productos");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { products, loading, error, lastDoc, hasMore, fetchProducts };
}