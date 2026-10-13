import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../src/contexts/auth/AuthProvider";
import { CartProvider } from "../../src/contexts/cart/CartProvider";
import { FavoriteProvider } from "../../src/contexts/favorites/FavoriteProvider";
import { ThemeProvider } from "../../src/contexts/theme/ThemeProvider";

/** Mismos providers que AppProvider, con MemoryRouter para controlar la ruta inicial. */
export function AllProviders({ children, route = "/" }: { children: ReactNode; route?: string }) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <FavoriteProvider>{children}</FavoriteProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}
