import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductCard from "../src/components/common/ProductCard";
import { cartReducer, initialState } from "../src/contexts/cart/CartReducer";
import { favoriteReducer } from "../src/contexts/favorites/FavoriteReducer";
import type { Product } from "../src/types/product.types";

const product: Product = {
  id: "shoe-1",
  name: "Kairo Runner",
  nameLower: "kairo runner",
  description: "Zapatilla de entrenamiento",
  price: 79.99,
  stock: 2,
  categoryId: "zapatillas",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("cartReducer", () => {
  it("combines quantities without exceeding available stock", () => {
    const once = cartReducer(initialState, {
      type: "ADD_TO_CART",
      payload: { product, quantity: 1 },
    });
    const twice = cartReducer(once, {
      type: "ADD_TO_CART",
      payload: { product, quantity: 4 },
    });

    expect(twice.items).toHaveLength(1);
    expect(twice.items[0].quantity).toBe(2);
  });

  it("ignores invalid quantities and removes an item when it reaches zero", () => {
    const added = cartReducer(initialState, {
      type: "ADD_TO_CART",
      payload: { product, quantity: 1 },
    });
    const unchanged = cartReducer(added, {
      type: "DECREASE_QUANTITY",
      payload: { id: product.id, quantity: -1 },
    });
    const removed = cartReducer(unchanged, {
      type: "DECREASE_QUANTITY",
      payload: { id: product.id },
    });

    expect(unchanged).toBe(added);
    expect(removed.items).toEqual([]);
  });
});

describe("favoriteReducer", () => {
  it("keeps favorite IDs unique and removes only the requested ID", () => {
    const first = favoriteReducer({ favorites: [] }, { type: "ADD_FAVORITE", payload: product.id });
    const duplicate = favoriteReducer(first, { type: "ADD_FAVORITE", payload: product.id });
    const other = favoriteReducer(duplicate, { type: "ADD_FAVORITE", payload: "bag-1" });
    const result = favoriteReducer(other, { type: "REMOVE_FAVORITE", payload: product.id });

    expect(duplicate).toBe(first);
    expect(result.favorites).toEqual(["bag-1"]);
  });
});

describe("ProductCard", () => {
  it("sends the selected product ID to the cart action", () => {
    const onAddToCart = vi.fn();
    render(<ProductCard layout="grid" product={product} showPrice onAddToCart={onAddToCart} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    expect(onAddToCart).toHaveBeenCalledWith(product.id);
  });

  it("disables the add action when the product is out of stock", () => {
    render(
      <ProductCard
        layout="grid"
        product={{ ...product, stock: 0 }}
        showPrice
        onAddToCart={vi.fn()}
      />,
    );

    const addButton = screen.getByRole("button", { name: "Agotado" }) as HTMLButtonElement;
    expect(addButton.disabled).toBe(true);
  });
});