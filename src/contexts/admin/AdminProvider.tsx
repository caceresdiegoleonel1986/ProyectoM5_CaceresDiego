import type { ReactNode } from "react";
import { AdminProductsProvider } from "./AdminProductsProvider";
import { AdminOrdersProvider } from "./AdminOrdersProvider";

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