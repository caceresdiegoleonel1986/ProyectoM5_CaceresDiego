import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from "firebase/firestore";
import type { Order } from "../../types/order.types";

type AdminOrdersContextType = {
  orders: Order[];
  fetchOrders: (status?: string) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
};

const AdminOrdersContext = createContext<AdminOrdersContextType | null>(null);

export function AdminOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async (status?: string) => {
    let q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    if (status) q = query(q, where("status", "==", status));

    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(),
    })) as Order[];
    setOrders(data);
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: Order["status"]) => {
    await updateDoc(doc(db, "orders", id), { status });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }, []);

  return (
    <AdminOrdersContext.Provider value={{ orders, fetchOrders, updateOrderStatus }}>
      {children}
    </AdminOrdersContext.Provider>
  );
}

// efresh/only-export-component
export function useAdminOrders() {
  const ctx = useContext(AdminOrdersContext);
  if (!ctx) throw new Error("useAdminOrders debe usarse dentro de AdminOrdersProvider");
  return ctx;
}