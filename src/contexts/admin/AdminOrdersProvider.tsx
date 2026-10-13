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
import type { Order, OrderStatus } from "../../types/order.types";
import { AdminOrdersContext } from "./AdminOrdersContext";
import type { AdminAnalytics, AdminOrdersContextType } from "./AdminOrdersContext";
import { buildSalesCharts } from "./analytics";

const ordersRef = collection(db, "orders").withConverter(orderConverter);
const emptyAnalytics: AdminAnalytics = {
  productCount: 0,
  orderCount: 0,
  completedOrderCount: 0,
  completedRevenue: 0,
  revenueByDay: [],
  topProducts: [],
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
    const completedOrdersQuery = query(ordersRef, where("status", "==", "completed"));
    const recentOrdersQuery = query(ordersRef, orderBy("createdAt", "desc"), limit(200));
    const [productCount, orderCount, completedTotals, recentOrders] = await Promise.all([
      getCountFromServer(collection(db, "products")),
      getCountFromServer(ordersRef),
      getAggregateFromServer(completedOrdersQuery, {
        completedOrderCount: count(),
        completedRevenue: sum("total"),
      }),
      getDocs(recentOrdersQuery),
    ]);
    const completedData = completedTotals.data();
    setAnalytics({
      productCount: productCount.data().count,
      orderCount: orderCount.data().count,
      completedOrderCount: completedData.completedOrderCount,
      completedRevenue: completedData.completedRevenue ?? 0,
      ...buildSalesCharts(recentOrders.docs.map((orderDoc) => orderDoc.data())),
    });
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
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