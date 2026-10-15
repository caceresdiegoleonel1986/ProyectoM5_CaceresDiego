import { beforeEach, describe, expect, it, vi } from "vitest";

type Snapshot = {
  exists: () => boolean;
  data: () => Record<string, unknown> | undefined;
};

type Transaction = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
  tx: { get: vi.fn(), set: vi.fn(), update: vi.fn(), delete: vi.fn() } as Transaction,
  getOrdersByUser: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, name: string) => ({ path: name }),
  doc: (_db: unknown, ...segments: string[]) => ({
    id: segments.at(-1),
    path: segments.join("/"),
  }),
  runTransaction: (_db: unknown, callback: (tx: Transaction) => Promise<unknown>) => callback(mocks.tx),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: () => "SERVER_TIMESTAMP",
  Timestamp: class MockTimestamp {
    toDate() { return new Date("2026-01-01T00:00:00.000Z"); }
  },
}));
vi.mock("../src/services/firebase", () => ({ db: {} }));
vi.mock("../src/services/orderService", () => ({ getOrdersByUser: mocks.getOrdersByUser }));

import { getReviewablePurchase, saveReview } from "../src/services/reviewService";

const review = {
  productId: "p1",
  userId: "u1",
  userName: "Ana",
  rating: 5,
  comment: "Muy bueno",
  orderId: "o1",
  orderItemIndex: 0,
};

function snapshot(data: Record<string, unknown> | undefined): Snapshot {
  return { exists: () => data !== undefined, data: () => data };
}

describe("reviewService", () => {
  beforeEach(() => {
    Object.values(mocks.tx).forEach((fn) => fn.mockReset());
    mocks.getOrdersByUser.mockReset();
  });

  it("solo encuentra compras propias no canceladas que incluyan el producto", async () => {
    mocks.getOrdersByUser.mockResolvedValue([
      { id: "cancelled", status: "cancelled", items: [{ productId: "p1" }] },
      { id: "valid", status: "pending", items: [{ productId: "p2" }, { productId: "p1" }] },
    ]);

    await expect(getReviewablePurchase("p1", "u1")).resolves.toEqual({ orderId: "valid", orderItemIndex: 1 });
  });

  it("crea una sola reseña por usuario/producto y aumenta el contador", async () => {
    mocks.tx.get.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "products/p1") return snapshot({ rating: 4, ratingCount: 2 });
      if (ref.path === "orders/o1") return snapshot({ userId: "u1", status: "pending", items: [{ productId: "p1" }] });
      return snapshot(undefined);
    });

    const saved = await saveReview(review);

    expect(saved.id).toBe("u1_p1");
    expect(mocks.tx.set).toHaveBeenCalledWith(
      { id: "u1_p1", path: "reviews/u1_p1" },
      expect.objectContaining({ ...review, createdAt: "SERVER_TIMESTAMP" }),
    );
    expect(mocks.tx.update).toHaveBeenCalledWith(
      { id: "p1", path: "products/p1" },
      { rating: 4.33, ratingCount: 3 },
    );
  });

  it("edita la reseña sin aumentar el contador", async () => {
    const existing = {
      ...review,
      rating: 5,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    mocks.tx.get.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "products/p1") return snapshot({ rating: 4.5, ratingCount: 2 });
      if (ref.path === "orders/o1") return snapshot({ userId: "u1", status: "completed", items: [{ productId: "p1" }] });
      if (ref.path === "reviews/u1_p1") return snapshot(existing);
      return snapshot(undefined);
    });

    await saveReview({ ...review, rating: 3 }, "u1_p1");

    expect(mocks.tx.update).toHaveBeenCalledWith(
      { id: "u1_p1", path: "reviews/u1_p1" },
      expect.objectContaining({ rating: 3, comment: "Muy bueno", updatedAt: "SERVER_TIMESTAMP" }),
    );
    expect(mocks.tx.update).toHaveBeenCalledWith(
      { id: "p1", path: "products/p1" },
      { rating: 3.5, ratingCount: 2 },
    );
    expect(mocks.tx.set).not.toHaveBeenCalled();
  });

  it("migra una reseña antigua al ID estable al editarla", async () => {
    const oldReview = {
      ...review,
      rating: 4,
      createdAt: new Date("2025-12-01T00:00:00.000Z"),
    };
    mocks.tx.get.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "products/p1") return snapshot({ rating: 4, ratingCount: 1 });
      if (ref.path === "orders/o1") return snapshot({ userId: "u1", status: "processing", items: [{ productId: "p1" }] });
      if (ref.path === "reviews/legacy-review") return snapshot(oldReview);
      return snapshot(undefined);
    });

    const saved = await saveReview({ ...review, rating: 3 }, "legacy-review");

    expect(saved.id).toBe("u1_p1");
    expect(mocks.tx.set).toHaveBeenCalledWith(
      { id: "u1_p1", path: "reviews/u1_p1" },
      expect.objectContaining({ ...review, rating: 3, createdAt: "SERVER_TIMESTAMP", updatedAt: "SERVER_TIMESTAMP" }),
    );
    expect(mocks.tx.delete).toHaveBeenCalledWith({ id: "legacy-review", path: "reviews/legacy-review" });
    expect(mocks.tx.update).toHaveBeenCalledWith(
      { id: "p1", path: "products/p1" },
      { rating: 3, ratingCount: 1 },
    );
  });

  it("rechaza reseñas asociadas a una orden cancelada", async () => {
    mocks.tx.get.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "products/p1") return snapshot({ rating: 0, ratingCount: 0 });
      if (ref.path === "orders/o1") return snapshot({ userId: "u1", status: "cancelled", items: [{ productId: "p1" }] });
      return snapshot(undefined);
    });

    await expect(saveReview(review)).rejects.toThrow("compra propia no cancelada");
    expect(mocks.tx.set).not.toHaveBeenCalled();
    expect(mocks.tx.update).not.toHaveBeenCalled();
  });
});
