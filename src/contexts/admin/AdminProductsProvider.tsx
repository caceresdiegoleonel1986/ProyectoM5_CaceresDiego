import { useCallback, useState, type ReactNode } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { productConverter } from "../../services/converters/productConverter";
import type { Product } from "../../types/product.types";
import { AdminProductsContext } from "./AdminProductsContext";
import type { AdminProductsContextType } from "./AdminProductsContext";

const productsRef = collection(db, "products").withConverter(productConverter);

export function AdminProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<AdminProductsContextType["lastDoc"]>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchProducts: AdminProductsContextType["fetchProducts"] = useCallback(async ({
    categoryId,
    cursor,
    pageSize = 20,
  } = {}) => {
    let productQuery = query(productsRef);
    if (categoryId) productQuery = query(productQuery, where("categoryId", "==", categoryId));
    productQuery = query(productQuery, orderBy("nameLower"));
    if (cursor) productQuery = query(productQuery, startAfter(cursor));
    productQuery = query(productQuery, limit(pageSize));

    const snapshot = await getDocs(productQuery);
    const page = snapshot.docs.map((productDoc) => productDoc.data());
    setProducts((current) => cursor ? [...current, ...page] : page);
    setLastDoc(snapshot.docs.at(-1) ?? null);
    setHasMore(snapshot.docs.length === pageSize);
  }, []);

  const createProduct = useCallback(async (data: Omit<Product, "id">) => {
    const productRef = doc(productsRef);
    const product = { ...data, id: productRef.id };
    await setDoc(productRef, product);
    setProducts((current) => [...current, product]);
  }, []);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    await updateDoc(doc(productsRef, id), data);
    setProducts((current) => current.map((product) =>
      product.id === id ? { ...product, ...data } : product,
    ));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await deleteDoc(doc(productsRef, id));
    setProducts((current) => current.filter((product) => product.id !== id));
  }, []);

  return (
    <AdminProductsContext.Provider value={{
      products,
      lastDoc,
      hasMore,
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
    }}>
      {children}
    </AdminProductsContext.Provider>
  );
}