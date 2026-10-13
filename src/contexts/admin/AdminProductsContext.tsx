import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { db } from "../../config/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, query, where, orderBy, limit, startAfter,
  type DocumentSnapshot
} from "firebase/firestore";
import type { Product } from "../../types/product.types";

type AdminProductsContextType = {
  products: Product[];
  fetchProducts: (opts?: { categoryId?: string; cursor?: DocumentSnapshot | null; pageSize?: number }) => Promise<void>;
  createProduct: (data: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
};

const AdminProductsContext = createContext<AdminProductsContextType | null>(null);

export function AdminProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async ({ categoryId, cursor, pageSize = 20 }: { categoryId?: string; cursor?: DocumentSnapshot | null; pageSize?: number } = {}) => {
    let q = query(collection(db, "products"), orderBy("nameLower"), limit(pageSize));
    if (categoryId) q = query(q, where("categoryId", "==", categoryId));
    if (cursor) q = query(q, startAfter(cursor));

    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    setProducts(data);
  }, []);

  const createProduct = useCallback(async (data: Omit<Product, "id">) => {
    const docRef = await addDoc(collection(db, "products"), data);
    setProducts(prev => [...prev, { ...data, id: docRef.id } as Product]);
  }, []);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    await updateDoc(doc(db, "products", id), data);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "products", id));
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <AdminProductsContext.Provider value={{ products, fetchProducts, createProduct, updateProduct, deleteProduct }}>
      {children}
    </AdminProductsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminProducts() {
  const ctx = useContext(AdminProductsContext);
  if (!ctx) throw new Error("useAdminProducts debe usarse dentro de AdminProductsProvider");
  return ctx;
}