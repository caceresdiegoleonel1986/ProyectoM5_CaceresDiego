import { useState } from "react";
import type { Order } from "../../types/order.types";
import type { ReactNode } from "react";
import { OrderContext } from "./OrderContext";
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  return (
    <OrderContext.Provider value={{ orders, setOrders }}>
      {children}
    </OrderContext.Provider>
  );
};
