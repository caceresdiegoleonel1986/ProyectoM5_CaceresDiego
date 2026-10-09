import {
  collection, query, where, orderBy,
  startAt, endAt, startAfter, limit, getDocs,
  doc, getDoc,
  type DocumentSnapshot, type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "../types/product.types";

export type ListProductsParams = {
  categoryId?: string | null;
  searchPrefix?: string;
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
  orderByField?: 'nameLower' | 'price' | 'createdAt';
  direction?: 'asc' | 'desc';
};

export type ListProductsResult = {
  items: Product[];
  lastDoc: DocumentSnapshot | null;
};

export async function listProducts(
  params: ListProductsParams = {}
): Promise<ListProductsResult> {
  const {
    categoryId, searchPrefix, pageSize = 20, cursor,
    orderByField = 'nameLower', direction = 'asc'
  } = params;

  const constraints: QueryConstraint[] = [];

  if (categoryId) constraints.push(where("categoryId", "==", categoryId));
  constraints.push(orderBy(orderByField, direction));

  if (searchPrefix && searchPrefix.length >= 2 && orderByField === 'nameLower') {
    constraints.push(startAt(searchPrefix));
    constraints.push(endAt(searchPrefix + "\uf8ff"));
  }

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));

  const q = query(collection(db, "products"), ...constraints);

  try {
    const snap = await getDocs(q);
    const items: Product[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Product, "id">),
    }));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { items, lastDoc };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ((error as { code: string }).code === "failed-precondition" ||
        (error as { code: string }).code === "invalid-argument")
    ) {
      const message =
        "message" in error && typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : String(error);
      throw new Error(`[listProducts] Falta índice compuesto. Ver: ${message}`, {
        cause: error,
      });
    }
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  return snap.exists()
    ? { id: snap.id, ...(snap.data() as Omit<Product, "id">) }
    : null;
}

export async function listProductsByCategory(
  categoryId: string,
  pageSize = 20
): Promise<ListProductsResult> {
  return listProducts({ categoryId, pageSize });
}