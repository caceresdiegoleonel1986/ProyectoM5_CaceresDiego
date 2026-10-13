import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './cart/CartProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import ProductProvider from './products/ProductProvider'
import { OrderProvider } from './order/OrderProvider'
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
          <OrderProvider>
            {children}
          </OrderProvider>
          </FavoriteProvider>
        </CartProvider>
      </ProductProvider>
      </AuthProvider>
    </ThemeProvider>
    </BrowserRouter>
  );
}