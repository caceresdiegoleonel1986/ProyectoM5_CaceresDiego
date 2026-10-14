import { describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => {
  class Timestamp {
    constructor(private readonly date: Date) {}
    static fromDate(date: Date) {
      return new Timestamp(date);
    }
    toDate() {
      return this.date;
    }
  }
  return { Timestamp };
});

import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { productConverter } from "../src/services/converters/productConverter";
import type { Product } from "../src/types/product.types";

const snap = (data: Record<string, unknown>) =>
  ({ id: "p1", data: () => data }) as unknown as QueryDocumentSnapshot;

describe("productConverter.fromFirestore", () => {
  it("lanza si falta name o price", () => {
    expect(() => productConverter.fromFirestore(snap({ price: 1 }), {})).toThrow("p1");
    expect(() => productConverter.fromFirestore(snap({ name: "x", price: "1" }), {})).toThrow("p1");
  });

  it("aplica valores por defecto a campos opcionales", () => {
    const product = productConverter.fromFirestore(snap({ name: "Zapa", price: 5 }), {});
    expect(product).toMatchObject({
      id: "p1",
      nameLower: "zapa",
      description: "",
      stock: 0,
      categoryId: "zapatillas",
      rating: 5,
      ratingCount: 0,
      imageUrl: undefined,
      updatedAt: undefined,
    });
    expect(product.createdAt).toBeInstanceOf(Date);
  });

  it("convierte Timestamps a Date", () => {
    const created = new Date("2026-02-01T00:00:00.000Z");
    const updated = new Date("2026-03-01T00:00:00.000Z");
    const product = productConverter.fromFirestore(
      snap({ name: "Zapa", price: 5, createdAt: Timestamp.fromDate(created), updatedAt: Timestamp.fromDate(updated) }),
      {}
    );
    expect(product.createdAt).toEqual(created);
    expect(product.updatedAt).toEqual(updated);
  });
});

describe("productConverter.toFirestore", () => {
  // Sin nameLower ni description: se prueban los valores por defecto del converter.
  const product = {
    id: "p1",
    name: "Zapa",
    price: 5,
    stock: 3,
    categoryId: "zapatillas" as const,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  } as Product;

  it("normaliza campos, usa nulls para imagen y omite updatedAt ausente", () => {
    const data = productConverter.toFirestore(product);
    expect(data).toMatchObject({ nameLower: "zapa", description: "", imageUrl: null, rating: 5, ratingCount: 0 });
    expect(data.createdAt).toBeInstanceOf(Timestamp);
    expect("updatedAt" in data).toBe(false);
  });

  it("convierte updatedAt cuando existe", () => {
    const data = productConverter.toFirestore({ ...product, updatedAt: new Date("2026-04-01T00:00:00.000Z") });
    expect(data.updatedAt).toBeInstanceOf(Timestamp);
  });
});
