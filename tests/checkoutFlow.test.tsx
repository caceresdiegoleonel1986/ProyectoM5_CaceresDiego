import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import type { User as FirebaseUser } from "firebase/auth";
import { Link, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "../src/components/common/ProductCard";
import { useCart } from "../src/contexts/cart/useCart";
import CheckoutPage from "../src/pages/CheckoutPage";
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

vi.mock("../src/services/authService", () => authMocks);
vi.mock("../src/services/orderService", () => orderMocks);

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
    await waitFor(() => expect(localStorage.getItem("cart")).toBe("[]"));
  });

  it("no crea la orden si el pago simulado es rechazado y conserva el carrito", async () => {
    await goToCheckoutWithOneItem();
    fillShipping();
    fillCard("4000 0000 0000 0002");
    fireEvent.click(screen.getByRole("button", { name: /Pagar/ }));

    expect((await screen.findByRole("alert", {}, { timeout: 3000 })).textContent).toContain("rechazado");
    expect(orderMocks.createOrder).not.toHaveBeenCalled();
    expect(localStorage.getItem("cart")).toContain("shoe-1");
  });

  it("muestra un estado vacío si se entra al checkout sin items", async () => {
    renderWithProviders(app, "/checkout");

    expect(await screen.findByText("Tu carrito está vacío")).toBeTruthy();
  });
});
