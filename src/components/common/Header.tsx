import { useCart } from "../../contexts/cart/useCart";
import { useTheme } from "../../contexts/theme/useTheme";
import { useFavorite } from "../../contexts/favorites/useFavorite";
import { useAuth } from "../../contexts/auth/useAuth";
import { useHeaderVisible } from "../../hooks/useHeaderVisible";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorite();
  const { authState, logout } = useAuth();
  const user = authState.status === "authenticated" ? authState.user : null;
  const { headerRef } = useHeaderVisible();

  return (
    <header
      ref={headerRef}
      className="bg-primary text-white shadow-md rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center bg-white/95 hover:bg-white px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200"
          title="KairoShop Inicio"
        >
          <img
            src="/kairo-logo-full.png"
            alt="KairoShop"
            className="h-10 w-auto object-contain"
          />
        </a>

        {/* Navegación principal */}
        <nav className="flex gap-6 font-medium items-center">
          <a href="/" className="hover:text-secondary transition-colors">🏠 Inicio</a>
          <a href="/productos" className="hover:text-secondary transition-colors">🛍️ Productos</a>
          <a href="/carrito" className="relative hover:text-secondary transition-colors">
            🛒 Carrito
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-4 bg-secondary text-white text-xs rounded-full px-1">
                {totalItems}
              </span>
            )}
          </a>
          <a href="/favoritos" className="relative hover:text-secondary transition-colors">
            ❤️ Favoritos
            {totalFavorites > 0 && (
              <span className="absolute -top-2 -right-4 bg-secondary text-white text-xs rounded-full px-1">
                {totalFavorites}
              </span>
            )}
          </a>
        </nav>

        {/* Acciones de usuario */}
        <div className="flex items-center gap-4">
          {/* Toggle Dark */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md bg-white text-primary hover:bg-secondary hover:text-white transition-colors"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Autenticación */}
          {user ? (
            <>
              <span className="font-semibold">👋 Hola, {user.email}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-secondary hover:text-white transition-colors"
              >
                🚪 Salir
              </button>
            </>
          ) : (
            <>
              <a
                href="/ingresar"
                className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-secondary hover:text-white transition-colors"
              >
                🔑 Ingresar
              </a>
              <a
                href="/registrarse"
                className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-secondary hover:text-white transition-colors"
              >
                📝 Registrarse
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;