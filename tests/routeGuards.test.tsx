import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthState } from "../src/types/auth.types";

const auth = vi.hoisted(() => ({
  value: { authState: { status: "anonymous" } as AuthState, isAdmin: false },
}));

vi.mock("../src/contexts/auth/useAuth", () => ({ useAuth: () => auth.value }));

import { RequireAdmin, RequireAuth } from "../src/routes/AppRoutes";

const customer: AuthState = {
  status: "authenticated",
  user: { uid: "u1", email: "c@test.com", role: "customer", createdAt: new Date() } as never,
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/ingresar" element={<p>login</p>} />
        <Route path="/checkout" element={<RequireAuth><p>checkout</p></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><p>panel</p></RequireAdmin>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("guards de rutas", () => {
  afterEach(cleanup);

  it("redirige anónimos a /ingresar", () => {
    auth.value = { authState: { status: "anonymous" }, isAdmin: false };
    renderAt("/checkout");
    expect(screen.getByText("login")).toBeTruthy();
  });

  it("permite a un cliente autenticado entrar al checkout pero no al admin", () => {
    auth.value = { authState: customer, isAdmin: false };
    renderAt("/checkout");
    expect(screen.getByText("checkout")).toBeTruthy();
    cleanup();
    renderAt("/admin");
    expect(screen.getByText("home")).toBeTruthy();
  });

  it("permite el panel a administradores", () => {
    auth.value = { authState: customer, isAdmin: true };
    renderAt("/admin");
    expect(screen.getByText("panel")).toBeTruthy();
  });
});
