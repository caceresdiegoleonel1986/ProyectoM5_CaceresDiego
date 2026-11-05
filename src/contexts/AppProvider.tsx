import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './cart/CartProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import ProductProvider from './products/ProductProvider'
import { AuthProvider } from './auth/AuthProvider'
import { FavoriteProvider } from './favorites/FavoriteProvider'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <FavoriteProvider>
            {children}
          </FavoriteProvider>
        </CartProvider>
      </ProductProvider>
      </AuthProvider>
    </ThemeProvider>
    </BrowserRouter>
  );
}