import { beforeEach, describe, expect, it, vi } from "vitest";

const fs = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn((...args: unknown[]) => ({ args })),
  where: vi.fn((...args: unknown[]) => ({ where: args })),
  orderBy: vi.fn((...args: unknown[]) => ({ orderBy: args })),
  limit: vi.fn((n: number) => ({ limit: n })),
}));

vi.mock("firebase/firestore", () => ({
  collection: () => ({ withConverter: () => ({}) }),
  doc: (_: unknown, ...path: string[]) => ({ id: path[1], withConverter: () => ({ id: path[1] }) }),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: { fromDate: (d: Date) => d, now: () => "NOW" },
  ...fs,
}));
vi.mock("../src/services/firebase", () => ({ db: {} }));
vi.mock("../src/services/converters/orderConverter", () => ({ orderConverter: {} }));

import { getAllOrders, getOrderById, getOrdersByUser, updateOrderStatus } from "../src/services/orderService";

const docs = (...items: unknown[]) => ({ docs: items.map((o) => ({ data: () => o })) });

describe("consultas de órdenes", () => {
  beforeEach(() => {
    Object.values(fs).forEach((fn) => fn.mockClear());
  });

  it("getOrdersByUser filtra por usuario, ordena desc y limita a 50", async () => {
    fs.getDocs.mockResolvedValue(docs({ id: "o1" }, { id: "o2" }));

    const result = await getOrdersByUser("u1");

    expect(result).toEqual([{ id: "o1" }, { id: "o2" }]);
    expect(fs.where).toHaveBeenCalledWith("userId", "==", "u1");
    expect(fs.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(fs.limit).toHaveBeenCalledWith(50);
  });

  it("getAllOrders devuelve todas ordenadas por fecha", async () => {
    fs.getDocs.mockResolvedValue(docs({ id: "o1" }));

    expect(await getAllOrders()).toEqual([{ id: "o1" }]);
    expect(fs.orderBy).toHaveBeenCalledWith("createdAt", "desc");
  });

  it("getOrderById devuelve null si no existe", async () => {
    fs.getDoc.mockResolvedValueOnce({ exists: () => false });
    expect(await getOrderById("x")).toBeNull();

    fs.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ id: "o1" }) });
    expect(await getOrderById("o1")).toEqual({ id: "o1" });
  });
});

describe("updateOrderStatus", () => {
  beforeEach(() => {
    Object.values(fs).forEach((fn) => fn.mockClear());
  });

  it("falla si la orden no existe", async () => {
    fs.getDoc.mockResolvedValue({ exists: () => false });

    await expect(updateOrderStatus("x", "processing")).rejects.toThrow("Orden no encontrada");
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });

  it("agrega una entrada al historial conservando las anteriores", async () => {
    const previous = new Date("2026-01-01T00:00:00.000Z");
    fs.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ history: [{ status: "pending", changedAt: previous, note: "Creada" }] }),
    });

    await updateOrderStatus("o1", "processing", "Despachada");

    const payload = fs.updateDoc.mock.calls[0][1];
    expect(payload.status).toBe("processing");
    expect(payload.history).toHaveLength(2);
    expect(payload.history[0]).toEqual({ status: "pending", changedAt: previous, note: "Creada" });
    expect(payload.history[1]).toMatchObject({ status: "processing", note: "Despachada" });
  });

  it("usa una nota por defecto cuando no se indica", async () => {
    fs.getDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    await updateOrderStatus("o1", "completed");

    expect(fs.updateDoc.mock.calls[0][1].history[0].note).toBe("Estado actualizado a completed");
  });
});
