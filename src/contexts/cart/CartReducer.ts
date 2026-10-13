import type { CartItem } from "../../types/cartItem.types";
import type { Product } from "../../types/product.types";

export type CartState = {
  items: CartItem[];
};

export type CartAction =
  | { type: "ADD_TO_CART"; payload: { product: Product; quantity: number } }
  | { type: "REMOVE_FROM_CART"; payload: { id: string } }
  | { type: "DECREASE_QUANTITY"; payload: { id: string; quantity?: number } }
  | { type: "CLEAR_CART" };

export const initialState: CartState = {
  items: [],
};

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const { product, quantity } = action.payload;
      const stock = Number.isInteger(product.stock) && product.stock > 0 ? product.stock : 0;
      if (!Number.isInteger(quantity) || quantity <= 0 || stock === 0) return state;
      const existing = state.items.find(
        (item) => item.product.id === product.id
      );
      const nextQuantity = Math.min(stock, (existing?.quantity ?? 0) + quantity);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { product, quantity: nextQuantity }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { product, quantity: nextQuantity },
        ],
      };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload.id),
      };

    case "DECREASE_QUANTITY": {
      const decAmount = action.payload.quantity ?? 1;
      if (!Number.isInteger(decAmount) || decAmount <= 0) return state;
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity - decAmount }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [] };

    default:
      return state;
  }
}

export default cartReducer;