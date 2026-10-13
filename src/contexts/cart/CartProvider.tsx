import { useEffect, useReducer, useMemo, type ReactNode } from "react";
import type { Product } from "../../types/product.types";
import type { CartItem } from "../../types/cartItem.types";
import type { CartState } from "./CartReducer";
import { CartContext } from "./CartContext";
import { cartReducer, initialState } from "./CartReducer";

type SerializedCartItem = {
  product: Omit<Product, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt?: string };
  quantity: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSerializedCartItem(value: unknown): value is SerializedCartItem {
  if (!isRecord(value) || !isRecord(value.product)) return false;
  const product = value.product;
  const validCategories = ["zapatillas", "mochilas", "auriculares", "smartwatches", "camperas"];
  return Number.isInteger(value.quantity) && Number(value.quantity) > 0
    && typeof product.id === "string"
    && typeof product.name === "string"
    && typeof product.nameLower === "string"
    && typeof product.description === "string"
    && typeof product.price === "number"
    && typeof product.stock === "number"
    && typeof product.categoryId === "string"
    && validCategories.includes(product.categoryId)
    && typeof product.createdAt === "string"
    && Number.isFinite(Date.parse(product.createdAt))
    && (product.imageUrl === undefined || typeof product.imageUrl === "string")
    && (product.updatedAt === undefined || typeof product.updatedAt === "string");
}

function loadCartState(): CartState {
  if (typeof localStorage === "undefined") return initialState;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem("cart") ?? "null");
    if (!Array.isArray(stored)) return initialState;
    const items: CartItem[] = stored.filter(isSerializedCartItem).map((item) => {
      const { updatedAt, ...product } = item.product;
      return {
        quantity: item.quantity,
        product: {
          ...product,
          createdAt: new Date(product.createdAt),
          ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}),
        },
      };
    });
    return { items };
  } catch {
    return initialState;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, loadCartState);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(state.items));
    }
  }, [state.items]);

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