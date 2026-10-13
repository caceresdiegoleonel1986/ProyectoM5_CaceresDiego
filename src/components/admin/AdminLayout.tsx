import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[var(--foreground)] px-4 py-3 text-[var(--background)]">
        <strong>KairoShop · Panel de administración</strong>
        <nav aria-label="Navegación de administración" className="flex gap-4">
          <a href="#analiticas">Analíticas</a>
          <a href="#productos">Productos</a>
          <a href="#ordenes">Órdenes</a>
          <Link to="/">Volver a la tienda</Link>
        </nav>
      </header>
      <main className="px-4">{children}</main>
    </div>
  );
}

export default AdminLayout;
