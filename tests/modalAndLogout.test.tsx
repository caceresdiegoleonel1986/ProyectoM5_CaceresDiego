import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LogoutConfirmButton from "../src/components/common/LogoutConfirmButton";
import ConfirmActionButton from "../src/components/common/ConfirmActionButton";
import Modal from "../src/components/ui/Modal";

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock("../src/contexts/auth/useAuth", () => ({
  useAuth: () => ({ logout }),
}));

describe("Modal", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    logout.mockReset();
  });

  it("closes on Escape and on backdrop interaction", () => {
    const onClose = vi.fn();
    render(<Modal isOpen title="Confirmación" onClose={onClose}>Contenido</Modal>);

    expect(screen.getByRole("dialog", { name: "Confirmación" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = document.querySelector(".dialog-backdrop");
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("LogoutConfirmButton", () => {
  afterEach(() => cleanup());

  it("requires confirmation before signing out", async () => {
    logout.mockResolvedValue(undefined);
    render(<LogoutConfirmButton>Salir</LogoutConfirmButton>);

    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(screen.getByRole("dialog", { name: "¿Quieres cerrar sesión?" })).toBeTruthy();
    expect(logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sí, cerrar sesión" }));
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
describe("ConfirmActionButton", () => {
  afterEach(() => cleanup());

  it("does not perform the action until confirmation", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmActionButton
        title="Vaciar carrito"
        description="Se eliminarán los artículos."
        confirmLabel="Vaciar"
        onConfirm={onConfirm}
      >
        Vaciar carrito
      </ConfirmActionButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    fireEvent.click(screen.getByRole("button", { name: "Vaciar" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});