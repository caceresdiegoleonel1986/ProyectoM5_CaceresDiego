import { createContext } from "react";
import type { Order, OrderStatus } from "../../types/order.types";
import type { RevenuePoint, TopProduct } from "./analytics";

export type AdminAnalytics = {
  productCount: number;
  orderCount: number;
  completedOrderCount: number;
  completedRevenue: number;
  revenueByDay: RevenuePoint[];
  topProducts: TopProduct[];
};

export type AdminOrdersContextType = {
  orders: Order[];
  analytics: AdminAnalytics;
  fetchOrders: (status?: OrderStatus) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
};

export const AdminOrdersContext = createContext<AdminOrdersContextType | null>(null);