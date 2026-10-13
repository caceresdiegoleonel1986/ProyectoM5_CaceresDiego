import { useContext } from "react";
import { AdminProductsContext } from "./AdminProductsContext";

export function useAdminProducts() {
  const context = useContext(AdminProductsContext);
  if (!context) throw new Error("useAdminProducts debe usarse dentro de AdminProductsProvider");
  return context;
}