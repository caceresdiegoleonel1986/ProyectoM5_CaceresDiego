import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ComponentType, PropsWithChildren, ReactNode } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminProvider } from "../src/contexts/admin/AdminProvider";
import { useAdminOrders } from "../src/contexts/admin/useAdminOrders";
import { useAdminProducts } from "../src/contexts/admin/useAdminProducts";
import { AuthProvider } from "../src/contexts/auth/AuthProvider";
import { useAuth } from "../src/contexts/auth/useAuth";
import { CartProvider } from "../src/contexts/cart/CartProvider";
import { useCart } from "../src/contexts/cart/useCart";
import { FavoriteProvider } from "../src/contexts/favorites/FavoriteProvider";
import { useFavorite } from "../src/contexts/favorites/useFavorite";
import { ProductProvider } from "../src/contexts/products/ProductProvider";
import { useProducts } from "../src/contexts/products/useProduct";
import { ThemeProvider } from "../src/contexts/theme/ThemeProvider";
import { useTheme } from "../src/contexts/theme/useTheme";
import type { Product } from "../src/types/product.types";
import type { Order } from "../src/types/order.types";

const firestoreMocks = vi.hoisted(() => {
  const collectionReference = { withConverter: vi.fn() };
  collectionReference.withConverter.mockReturnValue(collectionReference);
  return {
    collectionReference,
    collection: vi.fn(() => collectionReference),
    count: vi.fn(() => ({ operation: "count" })),
    deleteDoc: vi.fn(),
    doc: vi.fn((_reference?: unknown, id?: string) => ({ id: id ?? "generated-product" })),
    endAt: vi.fn((value: string) => ({ operation: "endAt", value })),
    getAggregateFromServer: vi.fn(),
    getCountFromServer: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((value: number) => ({ operation: "limit", value })),
    orderBy: vi.fn((field: string, direction?: string) => ({ operation: "orderBy", field, direction })),
    query: vi.fn((...constraints: unknown[]) => ({ constraints })),
    setDoc: vi.fn(),
    startAfter: vi.fn((cursor: unknown) => ({ operation: "startAfter", cursor })),
    startAt: vi.fn((value: string) => ({ operation: "startAt", value })),
    sum: vi.fn((field: string) => ({ operation: "sum", field })),
    updateDoc: vi.fn(),
    where: vi.fn((field: string, operator: string, value: unknown) => ({ operation: "where", field, operator, value })),
  };
});

const authMocks = vi.hoisted(() => ({
  ensureUserProfile: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logoutUser: vi.fn(),
  registerWithEmail: vi.fn(),
  subscribeToAuthState: vi.fn(),
}));

const orderServiceMocks = vi.hoisted(() => ({
  updateOrderStatus: vi.fn(),
}));

vi.mock("../src/config/firebase", () => ({ db: {} }));

vi.mock("../src/services/converters/productConverter", () => ({ productConverter: {} }));
vi.mock("../src/services/converters/orderConverter", () => ({ orderConverter: {} }));
vi.mock("../src/services/authService", () => authMocks);
vi.mock("../src/services/orderService", () => orderServiceMocks);

vi.mock("firebase/firestore", () => ({
  collection: firestoreMocks.collection,
  count: firestoreMocks.count,
  deleteDoc: firestoreMocks.deleteDoc,
  doc: firestoreMocks.doc,
  endAt: firestoreMocks.endAt,
  getAggregateFromServer: firestoreMocks.getAggregateFromServer,
  getCountFromServer: firestoreMocks.getCountFromServer,
  getDocs: firestoreMocks.getDocs,
  limit: firestoreMocks.limit,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  setDoc: firestoreMocks.setDoc,
  startAfter: firestoreMocks.startAfter,
  startAt: firestoreMocks.startAt,
  sum: firestoreMocks.sum,
  updateDoc: firestoreMocks.updateDoc,
  where: firestoreMocks.where,
}));

const product: Product = {
  id: "shoe-1",
  name: "Kairo Runner",
  nameLower: "kairo runner",
  description: "Zapatilla de prueba",
  price: 79.99,
  stock: 5,
  categoryId: "zapatillas",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const customerProfile = {
  id: "customer-1",
  email: "customer@example.test",
  displayName: "Cliente",
  role: "customer" as const,
};

const adminProfile = {
  id: "admin-1",
  email: "admin@example.test",
  displayName: "Admin",
  role: "admin" as const,
};

const order: Order = {
  id: "order-1",
  userId: customerProfile.id,
  userEmail: customerProfile.email,
  items: [{ productId: product.id, name: product.name, priceAtPurchase: product.price, quantity: 1 }],
  total: product.price,
  createdAt: new Date("2026-01-02T12:00:00.000Z"),
  status: "pending",
  history: [],
};

function documentFor(value: Product | Order) {
  return { id: value.id, data: () => value };
}

function createWrapper(Provider: ComponentType<{ children: ReactNode }>) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <Provider>{children}</Provider>;
  };
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.clearAllMocks();
  firestoreMocks.collectionReference.withConverter.mockReturnValue(firestoreMocks.collectionReference);
  firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
  firestoreMocks.setDoc.mockResolvedValue(undefined);
  firestoreMocks.updateDoc.mockResolvedValue(undefined);
  firestoreMocks.deleteDoc.mockResolvedValue(undefined);
  firestoreMocks.getCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });
  firestoreMocks.getAggregateFromServer.mockResolvedValue({ data: () => ({ completedOrderCount: 0, completedRevenue: 0 }) });
  authMocks.subscribeToAuthState.mockImplementation((listener: (user: FirebaseUser | null) => void) => {
    listener(null);
    return vi.fn();
  });
  authMocks.ensureUserProfile.mockResolvedValue(customerProfile);
  authMocks.loginWithEmail.mockResolvedValue(customerProfile);
  authMocks.loginWithGoogle.mockResolvedValue(customerProfile);
  authMocks.registerWithEmail.mockResolvedValue(customerProfile);
  authMocks.logoutUser.mockResolvedValue(undefined);
  orderServiceMocks.updateOrderStatus.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("dark");
});

describe("CartProvider y useCart", () => {
  it("expone acciones, derivados y persiste el carrito en localStorage", async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper(CartProvider) });

    act(() => result.current.addToCart(product, 2));

    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(159.98);
    await waitFor(() => expect(localStorage.getItem("cart")).toContain("shoe-1"));
  });

  it("rehidrata productos válidos y descarta datos malformados", () => {
    localStorage.setItem("cart", JSON.stringify([
      { product, quantity: 2 },
      { product: { id: "broken" }, quantity: 1 },
    ]));
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper(CartProvider) });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.createdAt).toBeInstanceOf(Date);
  });
});

describe("FavoriteProvider y useFavorite", () => {
  it("hidrata favoritos, evita duplicados y persiste cambios", async () => {
    localStorage.setItem("favorites", JSON.stringify(["existing"]));
    const { result } = renderHook(() => useFavorite(), { wrapper: createWrapper(FavoriteProvider) });

    await waitFor(() => expect(result.current.favorites).toEqual(["existing"]));
    act(() => {
      result.current.addFavorite(product.id);
      result.current.addFavorite(product.id);
    });

    expect(result.current.totalFavorites).toBe(2);
    await waitFor(() => expect(localStorage.getItem("favorites")).toBe('["existing","shoe-1"]'));
    act(() => result.current.removeFavorite("existing"));
    expect(result.current.favorites).toEqual([product.id]);
  });
});

describe("ThemeProvider y useTheme", () => {
  it("lee el tema guardado y sincroniza toggle con DOM y localStorage", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper(ThemeProvider) });

    expect(result.current.theme).toBe("light");
    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("AuthProvider y useAuth", () => {
  it("cambia a admin al completar login y a anonymous al cerrar sesión", async () => {
    authMocks.loginWithEmail.mockResolvedValue(adminProfile);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper(AuthProvider) });

    await act(async () => {
      await result.current.login(adminProfile.email, "secret");
    });
    expect(result.current.authState.status).toBe("authenticated");
    expect(result.current.isAdmin).toBe(true);

    await act(async () => result.current.logout());
    expect(result.current.authState.status).toBe("anonymous");
  });

  it("restaura sesión desde el listener y limpia la suscripción al desmontar", async () => {
    const unsubscribe = vi.fn();
    authMocks.ensureUserProfile.mockResolvedValue(adminProfile);
    authMocks.subscribeToAuthState.mockImplementation((listener: (user: FirebaseUser | null) => void) => {
      listener({ uid: adminProfile.id, email: adminProfile.email, displayName: adminProfile.displayName } as FirebaseUser);
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useAuth(), { wrapper: createWrapper(AuthProvider) });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("ProductProvider y useProducts", () => {
  it("aplica acciones del contexto y expone la primera página con cursor", async () => {
    const lastDocument = documentFor(product);
    firestoreMocks.getDocs.mockResolvedValue({ docs: [lastDocument] });
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper(ProductProvider) });

    act(() => result.current.addProduct(product));
    expect(result.current.products).toEqual([product]);

    await act(async () => {
      await result.current.fetchProducts({ pageSize: 1 });
    });

    expect(result.current.products).toEqual([product]);
    expect(result.current.lastDoc).toBe(lastDocument);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.loading).toBe(false);
  });
});

describe("AdminProvider y hooks admin", () => {
  it("carga y crea productos mediante useAdminProducts", async () => {
    firestoreMocks.getDocs.mockResolvedValue({ docs: [documentFor(product)] });
    const { result } = renderHook(() => useAdminProducts(), { wrapper: createWrapper(AdminProvider) });

    await act(async () => {
      await result.current.fetchProducts({ pageSize: 2 });
    });
    expect(result.current.products).toEqual([product]);
    expect(result.current.hasMore).toBe(false);

    const { id: productId, ...newProduct } = product;
    expect(productId).toBe(product.id);
    await act(async () => {
      await result.current.createProduct(newProduct);
    });
    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
  });

  it("expone agregaciones y actualiza estado de órdenes con useAdminOrders", async () => {
    firestoreMocks.getDocs.mockResolvedValue({ docs: [documentFor(order)] });
    firestoreMocks.getCountFromServer
      .mockResolvedValueOnce({ data: () => ({ count: 1 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 3 }) });
    firestoreMocks.getAggregateFromServer.mockResolvedValue({
      data: () => ({ completedOrderCount: 2, completedRevenue: 159.98 }),
    });
    const { result } = renderHook(() => useAdminOrders(), { wrapper: createWrapper(AdminProvider) });

    await act(async () => {
      await result.current.fetchOrders("pending");
      await result.current.fetchAnalytics();
    });

    expect(result.current.orders).toEqual([order]);
    expect(result.current.analytics).toEqual({
      productCount: 1,
      orderCount: 3,
      completedOrderCount: 2,
      completedRevenue: 159.98,
      revenueByDay: [{ date: "2026-01-02", revenue: 79.99 }],
      topProducts: [{ name: "Kairo Runner", quantity: 1 }],
    });

    await act(async () => result.current.updateOrderStatus(order.id, "completed"));
    expect(orderServiceMocks.updateOrderStatus).toHaveBeenCalledWith(order.id, "completed");
    expect(result.current.orders[0].status).toBe("completed");
  });
});