import { useContext } from "react";
import { OrderContext } from "./OrderContext";
import type { OrderContextType } from "./OrderContext.types";

export function useOrder(): OrderContextType {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrder debe usarse dentro de un OrderProvider");
  }
  return ctx;
}