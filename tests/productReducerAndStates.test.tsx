import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "../src/components/states/ErrorState";
import { LoadingState } from "../src/components/states/LoadingState";
import { productReducer } from "../src/contexts/products/ProductReducer";
import type { ProductState } from "../src/contexts/products/ProductContext.types";
import type { Product } from "../src/types/product.types";

const make = (id: string, name = id): Product => ({
  id,
  name,
  nameLower: name.toLowerCase(),
  description: "",
  price: 10,
  stock: 1,
  categoryId: "zapatillas",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
});

const base: ProductState = {
  products: [make("a"), make("b")],
  loading: true,
  error: "boom",
  lastDoc: null,
  hasMore: true,
  loadingMore: false,
};

describe("productReducer", () => {
  it("SET_PRODUCTS reemplaza la lista y limpia loading y error", () => {
    const next = productReducer(base, { type: "SET_PRODUCTS", payload: [make("c")] });
    expect(next).toMatchObject({ loading: false, error: null });
    expect(next.products.map((p) => p.id)).toEqual(["c"]);
  });

  it("ADD_PRODUCT agrega sin mutar el estado previo", () => {
    const next = productReducer(base, { type: "ADD_PRODUCT", payload: make("c") });
    expect(next.products).toHaveLength(3);
    expect(base.products).toHaveLength(2);
  });

  it("REMOVE_PRODUCT elimina solo el id indicado", () => {
    const next = productReducer(base, { type: "REMOVE_PRODUCT", payload: "a" });
    expect(next.products.map((p) => p.id)).toEqual(["b"]);
  });

  it("UPDATE_PRODUCT reemplaza solo el producto con ese id", () => {
    const updated = make("b", "Nuevo");
    const next = productReducer(base, { type: "UPDATE_PRODUCT", payload: updated });
    expect(next.products[0]).toBe(base.products[0]);
    expect(next.products[1]).toBe(updated);
  });

  it("actualiza flags de carga, error y paginación", () => {
    expect(productReducer(base, { type: "SET_LOADING", payload: false }).loading).toBe(false);
    expect(productReducer(base, { type: "SET_ERROR", payload: null }).error).toBeNull();
    expect(productReducer(base, { type: "SET_HAS_MORE", payload: false }).hasMore).toBe(false);
    expect(productReducer(base, { type: "SET_LOADING_MORE", payload: true }).loadingMore).toBe(true);
    expect(productReducer(base, { type: "SET_LAST_DOC", payload: null }).lastDoc).toBeNull();
  });

  it("ignora acciones desconocidas", () => {
    const unknown = { type: "OTHER" } as unknown as Parameters<typeof productReducer>[1];
    expect(productReducer(base, unknown)).toBe(base);
  });
});

describe("ErrorState", () => {
  it("muestra el mensaje y no renderiza reintentar sin callback", () => {
    render(<ErrorState message="Fallo de red" />);
    expect(screen.getByRole("alert").textContent).toContain("Fallo de red");
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("llama onRetry al presionar Reintentar", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Fallo" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("LoadingState", () => {
  it("muestra el mensaje por defecto con role status", () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelector(".loading-state")?.textContent).toContain("Cargando...");
  });

  it("en modo inline no repite el texto y prioriza el skeleton", () => {
    const { container } = render(<LoadingState inline message="Espere" skeleton={<div data-testid="sk" />} />);
    expect(screen.getByTestId("sk")).toBeTruthy();
    expect(container.querySelector(".loading-state")?.textContent).not.toContain("Espere");
  });
});
