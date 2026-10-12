import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link to="/" className="site-footer__brand">Kairo<span>Shop</span></Link>
        <nav className="site-footer__nav" aria-label="Enlaces de tienda">
          <Link to="/productos">Catálogo</Link>
          <Link to="/favoritos">Favoritos</Link>
          <Link to="/carrito">Carrito</Link>
        </nav>
        <span className="site-footer__copyright">© {new Date().getFullYear()} KairoShop</span>
      </div>
    </footer>
  );
}

export default Footer;