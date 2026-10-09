import type { Order } from "../../types/order.types";

export type OrderContextType = {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
};