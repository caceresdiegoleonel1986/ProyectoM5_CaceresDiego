import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type { User as FirebaseUser } from "firebase/auth";
import { Link, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "../src/components/common/ProductCard";
import { useCart } from "../src/contexts/cart/useCart";
import CheckoutPage from "../src/pages/CheckoutPage";
import { OrderPriceChangedError } from "../src/services/orderErrors";
import type { Product } from "../src/types/product.types";
import { renderWithProviders } from "./utils/renderWithProviders";

const authMocks = vi.hoisted(() => ({
  ensureUserProfile: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logoutUser: vi.fn(),
  registerWithEmail: vi.fn(),
  subscribeToAuthState: vi.fn(),
}));
const orderMocks = vi.hoisted(() => ({ createOrder: vi.fn() }));
const userDataMocks = vi.hoisted(() => ({
  loadCart: vi.fn(),
  saveCart: vi.fn(),
  loadFavorites: vi.fn(),
  saveFavorites: vi.fn(),
  loadShippingAddress: vi.fn(),
  saveShippingAddress: vi.fn(),
}));

vi.mock("../src/services/authService", () => authMocks);
vi.mock("../src/services/orderService", () => orderMocks);
vi.mock("../src/services/userDataService", () => userDataMocks);

const product: Product = {
  id: "shoe-1",
  name: "Kairo Runner",
  nameLower: "kairo runner",
  description: "Zapatilla",
  price: 50,
  stock: 5,
  categoryId: "zapatillas",
  createdAt: new Date("2026-01-01T12:00:00.000Z"),
};
const customer = { id: "c1", email: "c@test.com", displayName: "Cliente", role: "customer" as const };

function Shop() {
  const { addToCart, totalItems, totalPrice } = useCart();
  return (
    <>
      <ProductCard layout="grid" product={product} showPrice onAddToCart={() => addToCart(product, 1)} />
      <p data-testid="summary">{totalItems} items / ${totalPrice}</p>
      <Link to="/checkout">Ir al checkout</Link>
    </>
  );
}

const app = (
  <Routes>
    <Route path="/" element={<Shop />} />
    <Route path="/checkout" element={<CheckoutPage />} />
  </Routes>
);

function fillShipping() {
  fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: "Ana Perez" } });
  fireEvent.change(screen.getByLabelText(/^Dirección/), { target: { value: "Calle 1" } });
  fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: "Rosario" } });
  fireEvent.change(screen.getByLabelText(/Código postal/), { target: { value: "2000" } });
}

function fillCard(number: string) {
  fireEvent.change(screen.getByLabelText(/Número de tarjeta/), { target: { value: number } });
  fireEvent.change(screen.getByLabelText(/Vencimiento/), { target: { value: "12/30" } });
  fireEvent.change(screen.getByLabelText(/CVC/), { target: { value: "123" } });
}

async function goToCheckoutWithOneItem() {
  renderWithProviders(app);
  await waitFor(() => expect(authMocks.ensureUserProfile).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: "Agregar al carrito" }));
  expect(screen.getByTestId("summary").textContent).toBe("1 items / $50");
  fireEvent.click(screen.getByRole("link", { name: "Ir al checkout" }));
  await screen.findByText("Revisa tu pedido");
}

describe("flujo integral: carrito → checkout → orden", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    authMocks.subscribeToAuthState.mockImplementation((listener: (user: FirebaseUser | null) => void) => {
      listener({ uid: customer.id, email: customer.email, displayName: customer.displayName } as FirebaseUser);
      return vi.fn();
    });
    authMocks.ensureUserProfile.mockResolvedValue(customer);
    orderMocks.createOrder.mockResolvedValue({ id: "order-123" });
    userDataMocks.loadCart.mockResolvedValue({ entries: [], items: [] });
    userDataMocks.saveCart.mockResolvedValue(undefined);
    userDataMocks.loadFavorites.mockResolvedValue([]);
    userDataMocks.saveFavorites.mockResolvedValue(undefined);
    userDataMocks.loadShippingAddress.mockResolvedValue(null);
    userDataMocks.saveShippingAddress.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("agrega al carrito, paga con tarjeta simulada, crea la orden y vacía el carrito", async () => {
    await goToCheckoutWithOneItem();
    fillShipping();
    fillCard("4242 4242 4242 4242");
    await waitFor(() => expect(screen.getByRole("button", { name: /Pagar \$50\.00/ })).toHaveProperty("disabled", false));
    fireEvent.click(screen.getByRole("button", { name: /Pagar \$50\.00/ }));

    await screen.findByText("order-123", {}, { timeout: 3000 });
    expect(orderMocks.createOrder).toHaveBeenCalledTimes(1);
    const [items, address, buyer, payment] = orderMocks.createOrder.mock.calls[0];
    expect(items).toEqual([expect.objectContaining({ productId: "shoe-1", quantity: 1 })]);
    expect(address).toMatchObject({ fullName: "Ana Perez", city: "Rosario" });
    expect(buyer).toMatchObject({ id: "c1" });
    expect(payment).toEqual({ method: "simulated-card", cardLast4: "4242" });
    await waitFor(() => expect(userDataMocks.saveCart).toHaveBeenLastCalledWith("c1", []));
  });

  describe("dirección guardada", () => {
    const saved = { fullName: "Ana Guardada", address: "Calle 9", city: "Córdoba", postalCode: "5000", phone: "351" };
    const value = (label: RegExp) => (screen.getByLabelText(label) as HTMLInputElement).value;

    it("autocompleta el checkout con la dirección de la cuenta", async () => {
      userDataMocks.loadShippingAddress.mockResolvedValue(saved);
      await goToCheckoutWithOneItem();

      await waitFor(() => expect(value(/^Dirección/)).toBe("Calle 9"));
      expect(value(/Nombre completo/)).toBe("Ana Guardada");
      expect(value(/Ciudad/)).toBe("Córdoba");
      expect(value(/Teléfono/)).toBe("351");
      expect(userDataMocks.loadShippingAddress).toHaveBeenCalledWith("c1");
    });

    it("no pisa lo que ya se escribió si la dirección llega después", async () => {
      let finishLoad: (address: typeof saved) => void = () => undefined;
      userDataMocks.loadShippingAddress.mockReturnValue(new Promise((resolve) => { finishLoad = resolve; }));
      await goToCheckoutWithOneItem();

      fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: "Mendoza" } });
      finishLoad(saved);

      await waitFor(() => expect(userDataMocks.loadShippingAddress).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve));
      expect(value(/Ciudad/)).toBe("Mendoza");
      expect(value(/^Dirección/)).toBe("");
    });

    it("guarda la dirección después de una compra exitosa", async () => {
      await goToCheckoutWithOneItem();
      fillShipping();
      fillCard("4242 4242 4242 4242");
      fireEvent.click(screen.getByRole("button", { name: /Pagar/ }));

      await screen.findByText("order-123", {}, { timeout: 3000 });
      expect(userDataMocks.saveShippingAddress).toHaveBeenCalledWith("c1", expect.objectContaining({
        fullName: "Ana Perez",
        address: "Calle 1",
        city: "Rosario",
        postalCode: "2000",
      }));
    });

    it("si no se puede guardar la dirección, la compra igual se confirma", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      userDataMocks.saveShippingAddress.mockRejectedValue(new Error("permission-denied"));
      await goToCheckoutWithOneItem();
      fillShipping();
      fillCard("4242 4242 4242 4242");
      fireEvent.click(screen.getByRole("button", { name: /Pagar/ }));

      await screen.findByText("order-123", {}, { timeout: 3000 });
      await waitFor(() => expect(consoleError).toHaveBeenCalled());
      expect(screen.queryByRole("alert")).toBeNull();
      consoleError.mockRestore();
    });

    it("si no se puede cargar, deja completar el formulario a mano", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      userDataMocks.loadShippingAddress.mockRejectedValue(new Error("permission-denied"));
      await goToCheckoutWithOneItem();

      await waitFor(() => expect(consoleError).toHaveBeenCalled());
      expect(value(/Nombre completo/)).toBe("Cliente");
      expect(screen.queryByRole("alert")).toBeNull();
      consoleError.mockRestore();
    });

    it("no guarda la dirección si la orden falla", async () => {
      orderMocks.createOrder.mockRejectedValueOnce(new Error("Stock insuficiente"));
      await goToCheckoutWithOneItem();
      fillShipping();
      fillCard("4242 4242 4242 4242");
      fireEvent.click(screen.getByRole("button", { name: /Pagar/ }));

      expect((await screen.findByRole("alert", {}, { timeout: 3000 })).textContent).toContain("Stock insuficiente");
      expect(userDataMocks.saveShippingAddress).not.toHaveBeenCalled();
    });
  });

  it("si cambió el precio actualiza el total y pide confirmar de nuevo", async () => {
    orderMocks.createOrder.mockRejectedValueOnce(
      new OrderPriceChangedError([{ productId: "shoe-1", name: "Kairo Runner", price: 75 }]),
    );
    await goToCheckoutWithOneItem();
    fillShipping();
    fillCard("4242 4242 4242 4242");
    fireEvent.click(screen.getByRole("button", { name: /Pagar \$50\.00/ }));

    expect((await screen.findByRole("alert", {}, { timeout: 3000 })).textContent).toContain("Cambió el precio de Kairo Runner");
    expect(screen.getByRole("button", { name: /Pagar \$75\.00/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Pagar \$75\.00/ }));

    await screen.findByText("order-123", {}, { timeout: 3000 });
    expect(orderMocks.createOrder.mock.calls[1][0]).toEqual([expect.objectContaining({ priceAtPurchase: 75 })]);
  });

  it("no crea la orden si el pago simulado es rechazado y conserva el carrito", async () => {
    await goToCheckoutWithOneItem();
    fillShipping();
    fillCard("4000 0000 0000 0002");
    fireEvent.click(screen.getByRole("button", { name: /Pagar/ }));

    expect((await screen.findByRole("alert", {}, { timeout: 3000 })).textContent).toContain("rechazado");
    expect(orderMocks.createOrder).not.toHaveBeenCalled();
    expect(userDataMocks.saveCart).toHaveBeenLastCalledWith("c1", [{ productId: "shoe-1", quantity: 1 }]);
  });

  it("muestra un estado vacío si se entra al checkout sin items", async () => {
    renderWithProviders(app, "/checkout");

    expect(await screen.findByText("Tu carrito está vacío")).toBeTruthy();
  });
});
