import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { User as FirebaseUser } from "firebase/auth";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../src/contexts/auth/AuthProvider";
import { useAuth } from "../src/contexts/auth/useAuth";
import { CartProvider } from "../src/contexts/cart/CartProvider";
import { useCart } from "../src/contexts/cart/useCart";
import { FavoriteProvider } from "../src/contexts/favorites/FavoriteProvider";
import { useFavorite } from "../src/contexts/favorites/useFavorite";
import type { Product } from "../src/types/product.types";

const authMocks = vi.hoisted(() => ({
  ensureUserProfile: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logoutUser: vi.fn(),
  registerWithEmail: vi.fn(),
  subscribeToAuthState: vi.fn(),
}));
const data = vi.hoisted(() => ({
  loadCart: vi.fn(),
  saveCart: vi.fn(),
  loadFavorites: vi.fn(),
  saveFavorites: vi.fn(),
}));

vi.mock("../src/services/authService", () => authMocks);
vi.mock("../src/services/userDataService", () => data);

const ana = { id: "ana", email: "ana@test.com", displayName: "Ana", role: "customer" as const };

function makeProduct(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    name: id,
    nameLower: id,
    description: "",
    price: 10,
    stock: 5,
    categoryId: "zapatillas",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

const wrapper = ({ children }: PropsWithChildren) => (
  <AuthProvider>
    <CartProvider>
      <FavoriteProvider>{children}</FavoriteProvider>
    </CartProvider>
  </AuthProvider>
);

function useAll() {
  return { auth: useAuth(), cart: useCart(), favorites: useFavorite() };
}

function startAs(user: "anonymous" | "ana") {
  authMocks.subscribeToAuthState.mockImplementation((listener: (user: FirebaseUser | null) => void) => {
    listener(user === "ana" ? ({ uid: ana.id, email: ana.email, displayName: ana.displayName } as FirebaseUser) : null);
    return vi.fn();
  });
  return renderHook(useAll, { wrapper });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  authMocks.ensureUserProfile.mockResolvedValue(ana);
  authMocks.loginWithEmail.mockResolvedValue(ana);
  authMocks.logoutUser.mockResolvedValue(undefined);
  data.loadCart.mockResolvedValue({ entries: [], items: [] });
  data.saveCart.mockResolvedValue(undefined);
  data.loadFavorites.mockResolvedValue([]);
  data.saveFavorites.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("carrito y favoritos en la cuenta", () => {
  it("restaura lo guardado al recuperar la sesión sin volver a escribirlo", async () => {
    const saved = makeProduct("p1");
    data.loadCart.mockResolvedValue({ entries: [{ productId: "p1", quantity: 2 }], items: [{ product: saved, quantity: 2 }] });
    data.loadFavorites.mockResolvedValue(["p9"]);

    const { result } = startAs("ana");

    await waitFor(() => expect(result.current.cart.items).toEqual([{ product: saved, quantity: 2 }]));
    await waitFor(() => expect(result.current.favorites.favorites).toEqual(["p9"]));
    expect(result.current.cart.syncing).toBe(false);
    expect(data.saveCart).not.toHaveBeenCalled();
    expect(data.saveFavorites).not.toHaveBeenCalled();
  });

  it("guarda cada cambio en la cuenta y no en localStorage", async () => {
    const { result } = startAs("ana");
    await waitFor(() => expect(result.current.cart.syncing).toBe(false));

    act(() => result.current.cart.addToCart(makeProduct("p1"), 2));
    act(() => result.current.favorites.addFavorite("p1"));

    await waitFor(() => expect(data.saveCart).toHaveBeenLastCalledWith("ana", [{ productId: "p1", quantity: 2 }]));
    expect(data.saveFavorites).toHaveBeenLastCalledWith("ana", ["p1"]);
    expect(localStorage.getItem("cart")).toBeNull();
    expect(localStorage.getItem("favorites")).toBeNull();
  });

  it("al iniciar sesión fusiona lo de invitado sin duplicar y lo quita de localStorage", async () => {
    const shared = makeProduct("p1", { price: 99 });
    data.loadCart.mockResolvedValue({
      entries: [{ productId: "p1", quantity: 1 }],
      items: [{ product: shared, quantity: 1 }],
    });
    data.loadFavorites.mockResolvedValue(["p1"]);
    const { result } = startAs("anonymous");
    act(() => {
      result.current.cart.addToCart(makeProduct("p1"), 3);
      result.current.cart.addToCart(makeProduct("p2"), 1);
      result.current.favorites.addFavorite("p2");
    });
    await waitFor(() => expect(localStorage.getItem("cart")).toContain("p2"));

    await act(async () => void (await result.current.auth.login(ana.email, "x")));

    await waitFor(() => expect(data.saveCart).toHaveBeenLastCalledWith("ana", [
      { productId: "p1", quantity: 3 },
      { productId: "p2", quantity: 1 },
    ]));
    expect(result.current.cart.items[0].product.price).toBe(99);
    expect(data.saveFavorites).toHaveBeenLastCalledWith("ana", ["p1", "p2"]);
    expect(localStorage.getItem("cart")).toBeNull();
    expect(localStorage.getItem("favorites")).toBeNull();
  });

  it("al cerrar sesión limpia el dispositivo sin borrar lo guardado en la cuenta", async () => {
    data.loadCart.mockResolvedValue({
      entries: [{ productId: "p1", quantity: 1 }],
      items: [{ product: makeProduct("p1"), quantity: 1 }],
    });
    const { result } = startAs("ana");
    await waitFor(() => expect(result.current.cart.items).toHaveLength(1));

    await act(async () => result.current.auth.logout());

    await waitFor(() => expect(result.current.cart.items).toEqual([]));
    expect(data.saveCart).not.toHaveBeenCalled();
    expect(localStorage.getItem("cart")).toBe("[]");
  });

  it("al volver a entrar no pisa la cuenta antes de terminar de cargarla", async () => {
    const saved = { entries: [{ productId: "p1", quantity: 4 }], items: [{ product: makeProduct("p1"), quantity: 4 }] };
    data.loadCart.mockResolvedValue(saved);
    const { result } = startAs("ana");
    await waitFor(() => expect(result.current.cart.items).toHaveLength(1));
    await act(async () => result.current.auth.logout());
    await waitFor(() => expect(result.current.cart.items).toEqual([]));

    let finishLoad: (value: typeof saved) => void = () => undefined;
    data.loadCart.mockReturnValue(new Promise((resolve) => { finishLoad = resolve; }));
    await act(async () => void (await result.current.auth.login(ana.email, "x")));

    expect(result.current.cart.syncing).toBe(true);
    expect(data.saveCart).not.toHaveBeenCalled();

    await act(async () => finishLoad(saved));
    await waitFor(() => expect(result.current.cart.items).toHaveLength(1));
    expect(data.saveCart).not.toHaveBeenCalled();
  });

  it("si la carga falla no escribe en la cuenta y conserva el dato en localStorage", async () => {
    data.loadCart.mockRejectedValue(new Error("permission-denied"));
    const { result } = startAs("ana");
    await waitFor(() => expect(data.loadCart).toHaveBeenCalled());
    await waitFor(() => expect(result.current.cart.syncing).toBe(false));

    act(() => result.current.cart.addToCart(makeProduct("p1"), 1));

    await waitFor(() => expect(localStorage.getItem("cart")).toContain("p1"));
    expect(data.saveCart).not.toHaveBeenCalled();
  });
});
