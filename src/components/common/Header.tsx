import { useState, useEffect } from "react";

export function Header() {
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDark(event.matches);
      document.documentElement.classList.toggle("dark", event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    document.documentElement.classList.toggle("dark", isDark);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isDark]);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  return (
    <header className="bg-primary text-white shadow-md rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo desde public */}
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

        {/* Acciones */}
        <div className="flex items-center gap-4">
          {/* Favoritos */}
          <button className="relative p-2 rounded-md bg-white text-primary hover:bg-secondary hover:text-white transition-colors">
            ❤️
            <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full px-1">
              5
            </span>
          </button>

          {/* Carrito */}
          <button className="relative p-2 rounded-md bg-white text-primary hover:bg-secondary hover:text-white transition-colors">
            🛒
            <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full px-1">
              2
            </span>
          </button>

          {/* Toggle Dark */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-md bg-white text-primary hover:bg-secondary hover:text-white transition-colors"
          >
            {isDark ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      <div className="bg-secondary text-white text-center py-2 font-semibold">
        ¡Bienvenido de nuevo, Diego! 🎉
      </div>

      <nav className="flex justify-center gap-6 py-3 font-medium">
        <a href="/shop" className="hover:text-secondary transition-colors">Tienda</a>
        <a href="/about" className="hover:text-secondary transition-colors">Nosotros</a>
        <a href="/contact" className="hover:text-secondary transition-colors">Contacto</a>
      </nav>
    </header>
  );
}

export default Header;