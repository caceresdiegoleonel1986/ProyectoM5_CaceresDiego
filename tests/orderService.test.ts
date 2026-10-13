import { beforeEach, describe, expect, it, vi } from "vitest";

type Tx = { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };

const fs = vi.hoisted(() => ({
  tx: { get: vi.fn(), update: vi.fn(), set: vi.fn() } as Tx,
}));

vi.mock("firebase/firestore", () => ({
  collection: () => ({ withConverter: () => ({}) }),
  doc: (_: unknown, ...path: string[]) => ({ id: path[1] ?? "order-1", path: path.join("/") }),
  runTransaction: (_: unknown, run: (tx: Tx) => Promise<void>) => run(fs.tx),
  serverTimestamp: () => "SERVER_TS",
  Timestamp: { fromDate: (d: Date) => d, now: () => "NOW" },
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("../src/services/firebase", () => ({ db: {} }));
vi.mock("../src/services/converters/orderConverter", () => ({ orderConverter: {} }));

import { createOrder } from "../src/services/orderService";

const address = { fullName: "Ana", address: "Calle 1", city: "BA", postalCode: "1000" };
const buyer = { id: "u1", email: "ana@test.com" };
const payment = { method: "simulated-card" as const, cardLast4: "4242" };
const line = (productId: string, quantity: number) => ({ productId, name: "x", priceAtPurchase: 1, quantity });

function productSnap(id: string, data: Record<string, unknown> | undefined) {
  return { id, ref: { id }, data: () => data };
}

describe("createOrder", () => {
  beforeEach(() => {
    Object.values(fs.tx).forEach((fn) => fn.mockReset());
  });

  it("rechaza carritos vacíos", async () => {
    await expect(createOrder([], address, buyer, payment)).rejects.toThrow("vacío");
    expect(fs.tx.set).not.toHaveBeenCalled();
  });

  it("usa el precio de Firestore, descuenta stock y guarda la orden pending con el pago simulado", async () => {
    fs.tx.get.mockResolvedValue(productSnap("p1", { name: "Zapa", price: 100, stock: 5 }));

    const result = await createOrder([line("p1", 1), line("p1", 2)], address, buyer, payment);

    expect(result).toEqual({ id: "order-1" });
    expect(fs.tx.update).toHaveBeenCalledWith({ id: "p1" }, { stock: 2 });
    const saved = fs.tx.set.mock.calls[0][1];
    expect(saved).toMatchObject({ userId: "u1", total: 300, status: "pending", payment, createdAt: "SERVER_TS" });
    expect(saved.items).toEqual([{ productId: "p1", name: "Zapa", priceAtPurchase: 100, quantity: 3 }]);
  });

  it("falla sin escribir si no hay stock suficiente", async () => {
    fs.tx.get.mockResolvedValue(productSnap("p1", { name: "Zapa", price: 100, stock: 1 }));

    await expect(createOrder([line("p1", 2)], address, buyer, payment)).rejects.toThrow("Stock insuficiente");
    expect(fs.tx.set).not.toHaveBeenCalled();
  });

  it("falla si el producto ya no existe", async () => {
    fs.tx.get.mockResolvedValue(productSnap("p1", undefined));

    await expect(createOrder([line("p1", 1)], address, buyer, payment)).rejects.toThrow("ya no está disponible");
  });
});
