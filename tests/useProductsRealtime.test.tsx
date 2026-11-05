import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "../src/types/product.types";
import { useProductsRealtime } from "../src/contexts/products/useProductsRealtime";

const firestoreMocks = vi.hoisted(() => {
  const collectionReference = { withConverter: vi.fn() };
  collectionReference.withConverter.mockReturnValue(collectionReference);
  return {
    collectionReference,
    getDocs: vi.fn(),
    limit: vi.fn((value: number) => ({ type: "limit", value })),
    onSnapshot: vi.fn(),
    orderBy: vi.fn((field: string) => ({ type: "orderBy", field })),
    query: vi.fn((...constraints: unknown[]) => ({ constraints })),
    startAfter: vi.fn((cursor: unknown) => ({ type: "startAfter", cursor })),
    where: vi.fn((field: string, operator: string, value: string) => ({ type: "where", field, operator, value })),
  };
});

vi.mock("../src/config/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => firestoreMocks.collectionReference),
  getDocs: firestoreMocks.getDocs,
  limit: firestoreMocks.limit,
  onSnapshot: firestoreMocks.onSnapshot,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  startAfter: firestoreMocks.startAfter,
  where: firestoreMocks.where,
}));

type FakeDocument = { id: string; data: () => Product };
type FakeSnapshot = { docs: FakeDocument[] };

const createProduct = (id: string): Product => ({
  id,
  name: `Producto ${id}`,
  nameLower: `producto ${id}`,
  description: "Producto de prueba",
  price: 20,
  stock: 3,
  categoryId: "zapatillas",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
});

describe("useProductsRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.collectionReference.withConverter.mockReturnValue(firestoreMocks.collectionReference);
  });

  it("subscribes to the first page and fetches the next page from its cursor", async () => {
    const firstDocument = { id: "first", data: () => createProduct("first") };
    const nextDocument = { id: "next", data: () => createProduct("next") };
    const unsubscribe = vi.fn();
    firestoreMocks.onSnapshot.mockImplementation((_query, listener) => {
      queueMicrotask(() => (listener as (snapshot: FakeSnapshot) => void)({ docs: [firstDocument] }));
      return unsubscribe;
    });
    firestoreMocks.getDocs.mockResolvedValue({ docs: [nextDocument] });

    const { result, unmount } = renderHook(() => useProductsRealtime(undefined, undefined, 1));
    await waitFor(() => expect(result.current.products.map((product) => product.id)).toEqual(["first"]));
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(firestoreMocks.startAfter).toHaveBeenCalledWith(firstDocument);
    expect(result.current.products.map((product) => product.id)).toEqual(["first", "next"]);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("búsqueda", () => {
    const named = (id: string, name: string): FakeDocument => ({
      id,
      data: () => ({ ...createProduct(id), name, nameLower: name.toLowerCase() }),
    });

    beforeEach(() => {
      firestoreMocks.onSnapshot.mockImplementation((_query, listener) => {
        queueMicrotask(() => (listener as (snapshot: FakeSnapshot) => void)({
          docs: [named("a", "Adidas NMD"), named("b", "Adidas Stan Smith"), named("c", "Bose 700")],
        }));
        return vi.fn();
      });
    });

    it("encuentra una palabra en cualquier parte del nombre y no ofrece más páginas", async () => {
      const { result } = renderHook(() => useProductsRealtime(undefined, "stan", 2));

      await waitFor(() => expect(result.current.products.map((product) => product.id)).toEqual(["b"]));
      expect(firestoreMocks.limit).toHaveBeenCalledWith(500);
      expect(result.current.hasMore).toBe(false);
    });

    it("cambiar el texto filtra lo cargado sin volver a consultar Firestore", async () => {
      const { result, rerender } = renderHook(
        ({ search }) => useProductsRealtime(undefined, search, 2),
        { initialProps: { search: "adidas" } },
      );
      await waitFor(() => expect(result.current.products.map((product) => product.id)).toEqual(["a", "b"]));

      rerender({ search: "bose" });

      expect(result.current.products.map((product) => product.id)).toEqual(["c"]);
      expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);
    });

    it("mantiene el filtro de categoría al buscar", async () => {
      const { result } = renderHook(() => useProductsRealtime("zapatillas", "stan", 2));

      await waitFor(() => expect(result.current.products).toHaveLength(1));
      expect(firestoreMocks.where).toHaveBeenCalledWith("categoryId", "==", "zapatillas");
    });
  });
});