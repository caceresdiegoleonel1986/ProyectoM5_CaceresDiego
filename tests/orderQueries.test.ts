import { beforeEach, describe, expect, it, vi } from "vitest";

const fs = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((...args: unknown[]) => ({ args })),
  where: vi.fn((...args: unknown[]) => ({ where: args })),
  orderBy: vi.fn((...args: unknown[]) => ({ orderBy: args })),
  limit: vi.fn((n: number) => ({ limit: n })),
}));
const tx = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));

vi.mock("firebase/firestore", () => ({
  collection: () => ({ withConverter: () => ({}) }),
  doc: (_: unknown, ...path: string[]) => ({ id: path[1], withConverter: () => ({ id: path[1] }) }),
  runTransaction: (_: unknown, run: (transaction: typeof tx) => Promise<unknown>) => run(tx),
  serverTimestamp: vi.fn(),
  increment: (amount: number) => ({ increment: amount }),
  Timestamp: { fromDate: (d: Date) => d, now: () => "NOW" },
  ...fs,
}));
vi.mock("../src/services/firebase", () => ({ db: {} }));
vi.mock("../src/services/converters/orderConverter", () => ({ orderConverter: {} }));

import { getOrderById, getOrdersByUser, updateOrderStatus } from "../src/services/orderService";

const docs = (...items: unknown[]) => ({ docs: items.map((o) => ({ data: () => o })) });

/** Responde tx.get según el id del documento; los que no figuran no existen. */
function stubDocuments(documents: Record<string, Record<string, unknown>>) {
  tx.get.mockImplementation(async (ref: { id: string }) => ({
    ref: { id: ref.id },
    exists: () => ref.id in documents,
    data: () => documents[ref.id],
  }));
}

function updateOf(id: string) {
  return tx.update.mock.calls.find(([ref]) => ref.id === id)?.[1];
}

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

  it("getOrderById devuelve null si no existe", async () => {
    fs.getDoc.mockResolvedValueOnce({ exists: () => false });
    expect(await getOrderById("x")).toBeNull();

    fs.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ id: "o1" }) });
    expect(await getOrderById("o1")).toEqual({ id: "o1" });
  });
});

describe("updateOrderStatus", () => {
  const items = [
    { productId: "p1", quantity: 2 },
    { productId: "p2", quantity: 1 },
  ];

  beforeEach(() => {
    tx.get.mockReset();
    tx.update.mockReset();
  });

  it("falla si la orden no existe", async () => {
    stubDocuments({});

    await expect(updateOrderStatus("x", "processing")).rejects.toThrow("Orden no encontrada");
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("agrega una entrada al historial conservando las anteriores", async () => {
    const previous = new Date("2026-01-01T00:00:00.000Z");
    stubDocuments({
      o1: { status: "pending", items, history: [{ status: "pending", changedAt: previous, note: "Creada" }] },
    });

    await updateOrderStatus("o1", "processing", "Despachada");

    const payload = updateOf("o1");
    expect(payload.status).toBe("processing");
    expect(payload.history).toHaveLength(2);
    expect(payload.history[0]).toEqual({ status: "pending", changedAt: previous, note: "Creada" });
    expect(payload.history[1]).toMatchObject({ status: "processing", note: "Despachada" });
  });

  it("usa una nota por defecto cuando no se indica", async () => {
    stubDocuments({ o1: { status: "processing", items } });

    await updateOrderStatus("o1", "completed");

    expect(updateOf("o1").history[0].note).toBe("Estado actualizado a completed");
  });

  it("no toca el stock si el cambio no es una cancelación", async () => {
    stubDocuments({ o1: { status: "pending", items }, p1: { stock: 1 }, p2: { stock: 1 } });

    await updateOrderStatus("o1", "processing");

    expect(updateOf("p1")).toBeUndefined();
    expect(updateOf("p2")).toBeUndefined();
  });

  it("al cancelar devuelve el stock de cada producto", async () => {
    stubDocuments({ o1: { status: "pending", items }, p1: { stock: 1 }, p2: { stock: 0 } });

    await updateOrderStatus("o1", "cancelled");

    expect(updateOf("p1")).toEqual({ stock: { increment: 2 } });
    expect(updateOf("p2")).toEqual({ stock: { increment: 1 } });
    expect(updateOf("o1").status).toBe("cancelled");
  });

  it("al cancelar omite los productos eliminados", async () => {
    stubDocuments({ o1: { status: "pending", items }, p2: { stock: 0 } });

    await updateOrderStatus("o1", "cancelled");

    expect(updateOf("p1")).toBeUndefined();
    expect(updateOf("p2")).toEqual({ stock: { increment: 1 } });
    expect(updateOf("o1").status).toBe("cancelled");
  });

  it.each(["cancelled", "pending", "completed"] as const)("una orden cancelada no pasa a %s", async (status) => {
    stubDocuments({ o1: { status: "cancelled", items }, p1: { stock: 1 }, p2: { stock: 1 } });

    await expect(updateOrderStatus("o1", status)).rejects.toThrow("ya está cancelada");
    expect(tx.update).not.toHaveBeenCalled();
  });
});
