import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../src/contexts/auth/AuthProvider";
import { useAuth } from "../src/contexts/auth/useAuth";
import { ProductProvider } from "../src/contexts/products/ProductProvider";
import { useProducts } from "../src/contexts/products/useProduct";
import type { UserProfile } from "../src/types/auth.types";

const fs = vi.hoisted(() => ({
  collection: vi.fn(() => ({})),
  endAt: vi.fn((value: string) => ({ endAt: value })),
  getDocs: vi.fn(),
  limit: vi.fn((value: number) => ({ limit: value })),
  orderBy: vi.fn((field: string) => ({ orderBy: field })),
  query: vi.fn((...constraints: unknown[]) => ({ constraints })),
  startAfter: vi.fn((cursor: unknown) => ({ startAfter: cursor })),
  startAt: vi.fn((value: string) => ({ startAt: value })),
  where: vi.fn((field: string, op: string, value: unknown) => ({ where: [field, op, value] })),
}));

const auth = vi.hoisted(() => ({
  ensureUserProfile: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logoutUser: vi.fn(),
  registerWithEmail: vi.fn(),
  subscribeToAuthState: vi.fn(),
}));

vi.mock("../src/config/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => fs);
vi.mock("../src/services/authService", () => auth);

const customer: UserProfile = { id: "u1", email: "ana@test.com", displayName: "Ana", role: "customer" } as UserProfile;
const admin: UserProfile = { ...customer, id: "u2", role: "admin" } as UserProfile;

const authWrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;

describe("AuthProvider", () => {
  let emit: (user: FirebaseUser | null) => void;
  const unsubscribe = vi.fn();

  beforeEach(() => {
    Object.values(auth).forEach((fn) => fn.mockReset());
    unsubscribe.mockReset();
    auth.subscribeToAuthState.mockImplementation((cb: (user: FirebaseUser | null) => void) => {
      emit = cb;
      return unsubscribe;
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("empieza en loading y pasa a anonymous sin sesión", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    expect(result.current.authState.status).toBe("loading");

    act(() => emit(null));

    expect(result.current.authState.status).toBe("anonymous");
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("restaura la sesión y expone el rol admin", async () => {
    auth.ensureUserProfile.mockResolvedValue(admin);
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });

    act(() => emit({ uid: "u2", displayName: "Ana" } as FirebaseUser));

    await waitFor(() => expect(result.current.authState.status).toBe("authenticated"));
    expect(result.current.role).toBe("admin");
    expect(result.current.isAdmin).toBe(true);
  });

  it("vuelve a anonymous si falla la sincronización del perfil", async () => {
    auth.ensureUserProfile.mockRejectedValue(new Error("permission-denied"));
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });

    act(() => emit({ uid: "u1", displayName: null } as FirebaseUser));

    await waitFor(() => expect(result.current.authState.status).toBe("anonymous"));
  });

  it("ignora respuestas de perfil obsoletas", async () => {
    let resolveFirst: (p: UserProfile) => void = () => undefined;
    auth.ensureUserProfile
      .mockReturnValueOnce(new Promise<UserProfile>((r) => (resolveFirst = r)))
      .mockResolvedValueOnce(customer);
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });

    act(() => emit({ uid: "u2" } as FirebaseUser));
    act(() => emit({ uid: "u1" } as FirebaseUser));
    await waitFor(() => expect(result.current.user?.id).toBe("u1"));
    await act(async () => resolveFirst(admin));

    expect(result.current.user?.id).toBe("u1");
  });

  it("login, loginGoogle y register autentican con el perfil devuelto", async () => {
    auth.loginWithEmail.mockResolvedValue(customer);
    auth.loginWithGoogle.mockResolvedValue(admin);
    auth.registerWithEmail.mockResolvedValue(customer);
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });

    await act(async () => void (await result.current.login("ana@test.com", "x")));
    expect(result.current.user?.id).toBe("u1");

    await act(async () => void (await result.current.loginGoogle()));
    expect(result.current.isAdmin).toBe(true);

    await act(async () => void (await result.current.register("ana@test.com", "x", "Ana")));
    expect(auth.registerWithEmail).toHaveBeenCalledWith("ana@test.com", "x", "Ana");
    expect(result.current.authState.status).toBe("authenticated");
  });

  it.each([
    ["login", (a: ReturnType<typeof useAuth>) => a.login("a@b.c", "x"), auth.loginWithEmail],
    ["loginGoogle", (a: ReturnType<typeof useAuth>) => a.loginGoogle(), auth.loginWithGoogle],
    ["register", (a: ReturnType<typeof useAuth>) => a.register("a@b.c", "x"), auth.registerWithEmail],
  ])("%s relanza el error y queda anonymous", async (_name, run, service) => {
    service.mockRejectedValue(new Error("auth/invalid-credential"));
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });

    await act(async () => {
      await expect(run(result.current)).rejects.toThrow("auth/invalid-credential");
    });

    expect(result.current.authState.status).toBe("anonymous");
  });

  it("logout cierra sesión y se desuscribe al desmontar", async () => {
    auth.loginWithEmail.mockResolvedValue(customer);
    const { result, unmount } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await act(async () => void (await result.current.login("a@b.c", "x")));

    await act(async () => result.current.logout());

    expect(auth.logoutUser).toHaveBeenCalledOnce();
    expect(result.current.authState.status).toBe("anonymous");
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

describe("ProductProvider", () => {
  const productsWrapper = ({ children }: PropsWithChildren) => <ProductProvider>{children}</ProductProvider>;
  const docs = (n: number, start = 0) =>
    Array.from({ length: n }, (_, i) => ({ id: `p${start + i}`, data: () => ({ name: `P${start + i}`, price: 1 }) }));

  beforeEach(() => {
    Object.values(fs).forEach((fn) => fn.mockClear());
    fs.getDocs.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("loadFirstPage aplica categoría, prefijo de búsqueda y límite", async () => {
    fs.getDocs.mockResolvedValue({ docs: docs(2) });
    const { result } = renderHook(() => useProducts(), { wrapper: productsWrapper });

    await act(async () => result.current.loadFirstPage({ categoryId: "zapatillas", searchPrefix: "run" }));

    expect(fs.where).toHaveBeenCalledWith("categoryId", "==", "zapatillas");
    expect(fs.startAt).toHaveBeenCalledWith("run");
    expect(fs.endAt).toHaveBeenCalledWith("run\uf8ff");
    expect(fs.limit).toHaveBeenCalledWith(20);
    expect(result.current.products.map((p) => p.id)).toEqual(["p0", "p1"]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("loadMore pagina con startAfter y concatena resultados", async () => {
    fs.getDocs.mockResolvedValueOnce({ docs: docs(20) }).mockResolvedValueOnce({ docs: docs(3, 20) });
    const { result } = renderHook(() => useProducts(), { wrapper: productsWrapper });

    await act(async () => result.current.loadFirstPage());
    expect(result.current.hasMore).toBe(true);
    await act(async () => result.current.loadMore());

    expect(fs.startAfter).toHaveBeenCalledOnce();
    expect(result.current.products).toHaveLength(23);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loadingMore).toBe(false);
  });

  it("loadMore no hace nada sin cursor", async () => {
    const { result } = renderHook(() => useProducts(), { wrapper: productsWrapper });

    await act(async () => result.current.loadMore());

    expect(fs.getDocs).not.toHaveBeenCalled();
  });

  it("expone un error legible si falla la consulta", async () => {
    fs.getDocs.mockRejectedValue(new Error("unavailable"));
    const { result } = renderHook(() => useProducts(), { wrapper: productsWrapper });

    await act(async () => result.current.loadFirstPage());

    expect(result.current.error).toBe("Error cargando productos");
    expect(result.current.loading).toBe(false);
  });
});
