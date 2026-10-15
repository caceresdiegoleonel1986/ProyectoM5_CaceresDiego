import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <strong className="admin-topbar__brand">KairoShop <span>· Panel de administración</span></strong>
        <nav aria-label="Navegación de administración" className="admin-topbar__nav">
          <a href="#analiticas">Analíticas</a>
          <a href="#productos">Productos</a>
          <a href="#ordenes">Órdenes</a>
          <Link to="/" className="admin-topbar__back">Volver a la tienda</Link>
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}

export default AdminLayout;
