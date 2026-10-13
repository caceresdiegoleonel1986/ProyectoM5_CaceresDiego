import { describe, expect, it } from "vitest";
import { buildSalesCharts } from "../src/contexts/admin/analytics";
import { simulatePayment } from "../src/services/paymentService";
import type { Order } from "../src/types/order.types";

const base: Omit<Order, "id" | "items" | "total" | "status" | "createdAt"> = { userId: "u1", history: [] };
const item = (name: string, quantity: number) => ({ productId: name, name, priceAtPurchase: 10, quantity });

describe("buildSalesCharts", () => {
  it("suma ingresos por día, ordena productos por unidades y excluye canceladas", () => {
    const orders: Order[] = [
      { ...base, id: "1", items: [item("A", 2), item("B", 1)], total: 30, status: "completed", createdAt: new Date(2026, 0, 2, 12) },
      { ...base, id: "2", items: [item("B", 3)], total: 30, status: "pending", createdAt: new Date(2026, 0, 2, 15) },
      { ...base, id: "3", items: [item("A", 9)], total: 90, status: "cancelled", createdAt: new Date(2026, 0, 1, 12) },
    ];

    expect(buildSalesCharts(orders)).toEqual({
      revenueByDay: [{ date: "2026-01-02", revenue: 60 }],
      topProducts: [{ name: "B", quantity: 4 }, { name: "A", quantity: 2 }],
    });
  });

  it("devuelve listas vacías sin órdenes y respeta el límite", () => {
    expect(buildSalesCharts([])).toEqual({ revenueByDay: [], topProducts: [] });
    const many: Order[] = ["A", "B", "C"].map((name, index) => ({
      ...base, id: name, items: [item(name, index + 1)], total: 1, status: "pending", createdAt: new Date(2026, 0, 1, 12),
    }));
    expect(buildSalesCharts(many, 2).topProducts.map((product) => product.name)).toEqual(["C", "B"]);
  });
});

describe("simulatePayment", () => {
  const valid = { number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };

  it("aprueba una tarjeta válida y guarda solo los últimos 4 dígitos", async () => {
    await expect(simulatePayment(valid, 0)).resolves.toEqual({ method: "simulated-card", cardLast4: "4242" });
  });

  it("rechaza la tarjeta de prueba declinada", async () => {
    await expect(simulatePayment({ ...valid, number: "4000000000000002" }, 0)).rejects.toThrow("rechazado");
  });

  it.each([
    [{ ...valid, number: "1234" }, "16 dígitos"],
    [{ ...valid, expiry: "13/30" }, "MM/AA"],
    [{ ...valid, cvc: "1" }, "código de seguridad"],
  ])("valida el formato (%#)", async (card, message) => {
    await expect(simulatePayment(card, 0)).rejects.toThrow(message);
  });
});
