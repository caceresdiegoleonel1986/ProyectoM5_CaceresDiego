import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './cart/CartProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import ProductProvider from './products/ProductProvider'
import { OrderProvider } from './order/OrderProvider'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
    <ThemeProvider>
      <ProductProvider>
        <CartProvider>
          <OrderProvider>
            {children}
          </OrderProvider>
        </CartProvider>
      </ProductProvider>
    </ThemeProvider>
    </BrowserRouter>
  );
}