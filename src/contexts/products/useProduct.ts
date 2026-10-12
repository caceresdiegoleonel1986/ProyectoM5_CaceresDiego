import { useContext } from "react";
import { ProductContext } from "./ProductContext";

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts debe usarse dentro de un ProductProvider");
  return ctx;
}
