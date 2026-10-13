import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../contexts/cart/useCart";
import { useTheme } from "../../contexts/theme/useTheme";
import { useFavorite } from "../../contexts/favorites/useFavorite";
import { useAuth } from "../../contexts/auth/useAuth";
import LogoutConfirmButton from "./LogoutConfirmButton";
import Spinner from "../ui/Spinner";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `site-nav__link${isActive ? " is-active" : ""}`;

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorite();
  const { authState, isAdmin } = useAuth();
  const user = authState.status === "authenticated" ? authState.user : null;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-brand" title="KairoShop Inicio">
          <img src="/kairo-logo-full.png" alt="KairoShop" />
        </Link>

        <nav className="site-nav" aria-label="Navegación principal">
          <NavLink to="/" end className={navLinkClass}>Inicio</NavLink>
          <NavLink to="/productos" className={navLinkClass}>Productos</NavLink>
          <NavLink to="/carrito" className={navLinkClass}>
            <span aria-hidden="true">🛒</span> Carrito
            {totalItems > 0 && (
              <span className="site-nav__count" aria-label={`${totalItems} artículos`}>
                {totalItems}
              </span>
            )}
          </NavLink>
          <NavLink to="/favoritos" className={navLinkClass}>
            <span aria-hidden="true">♥</span> Favoritos
            {totalFavorites > 0 && (
              <span className="site-nav__count" aria-label={`${totalFavorites} favoritos`}>
                {totalFavorites}
              </span>
            )}
          </NavLink>
          {user && <NavLink to="/mis-pedidos" className={navLinkClass}>Mis pedidos</NavLink>}
          {isAdmin && <NavLink to="/admin" className={navLinkClass}>Panel admin</NavLink>}
        </nav>

        <div className="site-actions">
          <button
            type="button"
            aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
            onClick={toggleTheme}
            className="icon-button"
          >
            {theme === "dark" ? "☼" : "☾"}
          </button>

          {user ? (
            <div className="account-actions">
              <div className="account-identity">
                <span className="account-identity__name">{user.displayName || user.email}</span>
                <span className={`role-badge${isAdmin ? " role-badge--admin" : ""}`}>
                  {isAdmin ? "ADMIN" : "CLIENTE"}
                </span>
              </div>
              <LogoutConfirmButton className="button button--quiet button--compact">
                Salir
              </LogoutConfirmButton>
            </div>
          ) : (
            authState.status === "loading" ? <Spinner size="sm" label="Verificando sesión" /> : (
              <div className="account-actions">
                <Link to="/ingresar" className="button button--quiet button--compact">Ingresar</Link>
                <Link to="/registrarse" className="button button--primary button--compact">Crear cuenta</Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;