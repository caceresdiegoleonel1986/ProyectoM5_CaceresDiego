import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LoadingState } from "../components/states";
import { useAuth } from "../contexts/auth/useAuth";

const ProductsPage = lazy(() => import("../pages/ProductsPages"));
const CartList = lazy(() => import("../components/common/CartList"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));
const AuthPage = lazy(() => import("../pages/AuthPage"));
const AdminRoute = lazy(() => import("../pages/AdminRoute"));
const FavoritesPage = lazy(() => import("../pages/FavoritesPage"));
const MyOrdersPage = lazy(() => import("../pages/MyOrdersPage"));

function RequireAuth({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState.status === "loading") return <LoadingState />;
  if (authState.status !== "authenticated") {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { authState, isAdmin } = useAuth();
  if (authState.status === "loading") return <LoadingState />;
  if (authState.status !== "authenticated") return <Navigate to="/ingresar" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/carrito" element={<CartList />} />
        <Route path="/favoritos" element={<FavoritesPage />} />
        <Route path="/mis-pedidos" element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/ingresar" element={<AuthPage />} />
        <Route path="/registrarse" element={<AuthPage />} />
        <Route path="/admin" element={<RequireAdmin><AdminRoute /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;