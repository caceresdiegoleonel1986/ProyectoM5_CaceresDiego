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
      const existing = state.items.find(
        (item) => item.product.id === action.payload.product.id
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { product: action.payload.product, quantity: action.payload.quantity },
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