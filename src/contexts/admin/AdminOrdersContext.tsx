import { createContext } from "react";
import type { Order } from "../../types/order.types";

export type AdminAnalytics = {
  productCount: number;
  orderCount: number;
  paidOrderCount: number;
  paidRevenue: number;
};

export type AdminOrdersContextType = {
  orders: Order[];
  analytics: AdminAnalytics;
  fetchOrders: (status?: Order["status"]) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
};

export const AdminOrdersContext = createContext<AdminOrdersContextType | null>(null);