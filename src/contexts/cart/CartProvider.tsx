import { useReducer, useMemo, type ReactNode } from "react";
import type { Product } from "../../types/product.types";
import { CartContext } from "./CartContext";
import { cartReducer, initialState } from "./CartReducer";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const value = useMemo(() => {
    const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

    const totalPrice =
      Math.round(
        state.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0) * 100
      ) / 100;

    const addToCart = (product: Product, quantity: number = 1) => {
      dispatch({ type: "ADD_TO_CART", payload: { product, quantity } });
    };

    const decreaseQuantity = (id: string, quantity: number = 1) => {
      dispatch({ type: "DECREASE_QUANTITY", payload: { id, quantity } });
    };

    const removeFromCart = (id: string) => {
      dispatch({ type: "REMOVE_FROM_CART", payload: { id } });
    };

    const clearCart = () => {
      dispatch({ type: "CLEAR_CART" });
    };

    return {
      items: state.items,
      totalItems,
      totalPrice,
      addToCart,
      decreaseQuantity,
      removeFromCart,
      clearCart,
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;