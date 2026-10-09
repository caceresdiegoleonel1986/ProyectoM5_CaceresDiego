import type { CartItem } from "../../types/cartItem.types";
import type { Product } from "../../types/product.types";

export type CartContextType = {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (Id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
};
