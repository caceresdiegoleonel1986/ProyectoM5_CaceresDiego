import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthErrorMessage } from "../src/services/authErrors";
import AuthPage from "../src/pages/AuthPage";

const login = vi.hoisted(() => vi.fn());

vi.mock("../src/contexts/auth/useAuth", () => ({
  useAuth: () => ({
    authState: { status: "unauthenticated" },
    login,
    loginGoogle: vi.fn(),
    register: vi.fn(),
  }),
}));

const firebaseError = (code: string) => Object.assign(new Error(`Firebase: Error (${code}).`), { code });

describe("getAuthErrorMessage", () => {
  it.each([
    ["auth/invalid-credential", "Email o contraseña incorrectos."],
    ["auth/wrong-password", "Email o contraseña incorrectos."],
    ["auth/user-not-found", "Email o contraseña incorrectos."],
    ["auth/email-already-in-use", "Ya existe una cuenta con este email. Inicia sesión o usa otro."],
    ["auth/too-many-requests", "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."],
  ])("traduce %s", (code, message) => {
    expect(getAuthErrorMessage(firebaseError(code))).toBe(message);
  });

  it.each([
    ["un código desconocido", firebaseError("auth/internal-error")],
    ["un error sin código", new Error("permission-denied")],
    ["un valor que no es un error", "falló"],
    ["un código llamado como una propiedad heredada", firebaseError("constructor")],
  ])("usa un mensaje genérico ante %s", (_, cause) => {
    expect(getAuthErrorMessage(cause)).toBe("No se pudo completar la autenticación. Inténtalo de nuevo.");
  });
});

describe("AuthPage", () => {
  afterEach(() => cleanup());

  it("muestra un mensaje claro y no el error técnico de Firebase", async () => {
    login.mockRejectedValue(firebaseError("auth/invalid-credential"));
    const { container } = render(
      <MemoryRouter initialEntries={["/ingresar"]}>
        <AuthPage />
      </MemoryRouter>,
    );

    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: "ana@test.com" } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: "incorrecta" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Email o contraseña incorrectos.");
    expect(login).toHaveBeenCalledWith("ana@test.com", "incorrecta");
  });
});
