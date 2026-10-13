import type { ReactNode } from "react";
import { AdminProductsProvider } from "./AdminProductsContext";
import { AdminOrdersProvider } from "./AdminOrdersContext";

export function AdminProvider({ children }: { children: ReactNode }) {
  return (
    <AdminProductsProvider>
      <AdminOrdersProvider>
        {children}
      </AdminOrdersProvider>
    </AdminProductsProvider>
  );
}

export default AdminProvider;