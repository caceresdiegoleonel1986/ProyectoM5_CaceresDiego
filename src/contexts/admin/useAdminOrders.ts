import { useContext } from "react";
import { AdminOrdersContext } from "./AdminOrdersContext";

export function useAdminOrders() {
  const ctx = useContext(AdminOrdersContext);
  if (!ctx) throw new Error("useAdminOrders debe usarse dentro de AdminOrdersProvider");
  return ctx;
}