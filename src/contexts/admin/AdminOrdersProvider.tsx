import { useCallback, useState, type ReactNode } from "react";
import {
  collection,
  count,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { orderConverter } from "../../services/converters/orderConverter";
import { updateOrderStatus as persistOrderStatus } from "../../services/orderService";
import type { Order } from "../../types/order.types";
import { AdminOrdersContext } from "./AdminOrdersContext";
import type { AdminAnalytics, AdminOrdersContextType } from "./AdminOrdersContext";

const ordersRef = collection(db, "orders").withConverter(orderConverter);
const emptyAnalytics: AdminAnalytics = {
  productCount: 0,
  orderCount: 0,
  paidOrderCount: 0,
  paidRevenue: 0,
};

export function AdminOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics>(emptyAnalytics);

  const fetchOrders: AdminOrdersContextType["fetchOrders"] = useCallback(async (status) => {
    let orderQuery = query(ordersRef);
    if (status) orderQuery = query(orderQuery, where("status", "==", status));
    orderQuery = query(orderQuery, orderBy("createdAt", "desc"), limit(100));

    const snapshot = await getDocs(orderQuery);
    setOrders(snapshot.docs.map((orderDoc) => orderDoc.data()));
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const paidOrdersQuery = query(ordersRef, where("status", "==", "paid"));
    const [productCount, orderCount, paidTotals] = await Promise.all([
      getCountFromServer(collection(db, "products")),
      getCountFromServer(ordersRef),
      getAggregateFromServer(paidOrdersQuery, {
        paidOrderCount: count(),
        paidRevenue: sum("total"),
      }),
    ]);
    const paidData = paidTotals.data();
    setAnalytics({
      productCount: productCount.data().count,
      orderCount: orderCount.data().count,
      paidOrderCount: paidData.paidOrderCount,
      paidRevenue: paidData.paidRevenue ?? 0,
    });
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: Order["status"]) => {
    await persistOrderStatus(id, status);
    const changedAt = new Date();
    setOrders((current) => current.map((order) => order.id === id ? {
      ...order,
      status,
      history: [...order.history, { status, changedAt, note: `Estado actualizado a ${status}` }],
    } : order));
  }, []);

  return (
    <AdminOrdersContext.Provider value={{ orders, analytics, fetchOrders, fetchAnalytics, updateOrderStatus }}>
      {children}
    </AdminOrdersContext.Provider>
  );
}