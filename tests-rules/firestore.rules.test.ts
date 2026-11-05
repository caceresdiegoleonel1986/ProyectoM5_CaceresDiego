import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Los servicios reales usan la conexión del usuario que corresponda a cada test.
const connection = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("../src/services/firebase", () => ({
  get db() {
    return connection.db;
  },
}));

const address = { fullName: "Ana", address: "Calle 1", city: "Rosario", postalCode: "2000", phone: "" };
const payment = { method: "simulated-card" as const, cardLast4: "4242" };

let env: RulesTestEnvironment;
let createOrder: typeof import("../src/services/orderService").createOrder;
let saveReview: typeof import("../src/services/reviewService").saveReview;

function as(uid: string, email = `${uid}@test.com`): Firestore {
  return env.authenticatedContext(uid, { email }).firestore() as unknown as Firestore;
}

function useServicesAs(uid: string): Firestore {
  const db = as(uid);
  connection.db = db;
  return db;
}

function orderData(uid: string, productId: string, quantity: number, priceAtPurchase = 100) {
  return {
    userId: uid,
    userEmail: `${uid}@test.com`,
    customerName: "Ana",
    items: [{ productId, name: "Zapa", priceAtPurchase, quantity }],
    total: priceAtPurchase * quantity,
    status: "pending",
    history: [],
    shippingAddress: address,
    payment,
    createdAt: serverTimestamp(),
  };
}

function reviewData(uid: string, productId: string, rating: number, orderId: string) {
  return {
    productId,
    userId: uid,
    userName: "Ana",
    rating,
    comment: "Muy bueno",
    orderId,
    orderItemIndex: 0,
    createdAt: serverTimestamp(),
  };
}

function draft(rating: number, orderId: string) {
  return { productId: "p1", userId: "ana", userName: "Ana", rating, comment: "Muy bueno", orderId, orderItemIndex: 0 };
}

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore() as unknown as Firestore, path), data);
  });
}

async function read(path: string) {
  let result: Record<string, unknown> | undefined;
  await env.withSecurityRulesDisabled(async (context) => {
    result = (await getDoc(doc(context.firestore() as unknown as Firestore, path))).data();
  });
  return result;
}

const purchasedOrder = {
  userId: "ana",
  status: "completed",
  total: 100,
  items: [{ productId: "p1", name: "Zapa", priceAtPurchase: 100, quantity: 1 }],
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-kairo",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
  connection.db = env.unauthenticatedContext().firestore();
  ({ createOrder } = await import("../src/services/orderService"));
  ({ saveReview } = await import("../src/services/reviewService"));
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  await seed("users/ana", { email: "ana@test.com", displayName: "Ana", role: "customer", createdAt });
  await seed("users/beto", { email: "beto@test.com", displayName: "Beto", role: "customer", createdAt });
  await seed("users/admin", { email: "admin@test.com", displayName: "Admin", role: "admin", createdAt });
  await seed("products/p1", { name: "Zapa", price: 100, stock: 5, rating: 4, ratingCount: 2 });
  await seed("products/p2", { name: "Mochila", price: 19.99, stock: 3, rating: 5, ratingCount: 0 });
  await seed("orders/compra", purchasedOrder);
});

describe("checkout real contra las reglas", () => {
  it("createOrder crea la orden y descuenta stock de varios productos", async () => {
    useServicesAs("ana");
    const { id } = await assertSucceeds(createOrder(
      [
        { productId: "p1", name: "Zapa", priceAtPurchase: 100, quantity: 2 },
        { productId: "p2", name: "Mochila", priceAtPurchase: 19.99, quantity: 3 },
      ],
      address,
      { id: "ana", email: "ana@test.com" },
      payment,
    ));

    expect(await read(`orders/${id}`)).toMatchObject({ userId: "ana", total: 259.97, status: "pending" });
    expect(await read("products/p1")).toMatchObject({ stock: 3, lastOrderId: id, lastOrderItemIndex: 0 });
    expect(await read("products/p2")).toMatchObject({ stock: 0, lastOrderId: id, lastOrderItemIndex: 1 });
  });

  it("una segunda compra del mismo producto también pasa", async () => {
    useServicesAs("ana");
    const items = [{ productId: "p1", name: "Zapa", priceAtPurchase: 100, quantity: 1 }];
    const buyer = { id: "ana", email: "ana@test.com" };
    await assertSucceeds(createOrder(items, address, buyer, payment));
    await assertSucceeds(createOrder(items, address, buyer, payment));

    expect(await read("products/p1")).toMatchObject({ stock: 3 });
  });
});

describe("abuso de stock", () => {
  it("rechaza bajar stock sin orden", async () => {
    await assertFails(updateDoc(doc(as("beto"), "products/p1"), { stock: 0 }));
  });

  it("rechaza bajar stock apuntando a una orden que no se crea en la transacción", async () => {
    await assertFails(updateDoc(doc(as("ana"), "products/p1"), {
      stock: 4, lastOrderId: "compra", lastOrderItemIndex: 0,
    }));
  });

  it("rechaza bajar stock apuntando a una orden inexistente", async () => {
    await assertFails(updateDoc(doc(as("ana"), "products/p1"), {
      stock: 4, lastOrderId: "no-existe", lastOrderItemIndex: 0,
    }));
  });

  it("rechaza bajar más stock que la cantidad de la orden", async () => {
    const db = as("beto");
    const batch = writeBatch(db);
    batch.set(doc(db, "orders/o1"), orderData("beto", "p1", 1));
    batch.update(doc(db, "products/p1"), { stock: 0, lastOrderId: "o1", lastOrderItemIndex: 0 });
    await assertFails(batch.commit());
  });

  it("rechaza una orden con un precio distinto al actual", async () => {
    const db = as("beto");
    const batch = writeBatch(db);
    batch.set(doc(db, "orders/o1"), orderData("beto", "p1", 1, 1));
    batch.update(doc(db, "products/p1"), { stock: 4, lastOrderId: "o1", lastOrderItemIndex: 0 });
    await assertFails(batch.commit());
  });

  it("rechaza una orden de otro producto", async () => {
    const db = as("beto");
    const batch = writeBatch(db);
    batch.set(doc(db, "orders/o1"), orderData("beto", "p2", 1, 19.99));
    batch.update(doc(db, "products/p1"), { stock: 4, lastOrderId: "o1", lastOrderItemIndex: 0 });
    await assertFails(batch.commit());
  });

  it("rechaza subir stock o cambiar el precio siendo cliente", async () => {
    const db = as("ana");
    await assertFails(updateDoc(doc(db, "products/p1"), { stock: 50 }));
    await assertFails(updateDoc(doc(db, "products/p1"), { price: 1 }));
  });

  it("no deja escribir sin sesión", async () => {
    const db = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertFails(updateDoc(doc(db, "products/p1"), { stock: 0 }));
  });
});

describe("reseñas reales contra las reglas", () => {
  it("saveReview crea una reseña y actualiza el promedio", async () => {
    useServicesAs("ana");
    await assertSucceeds(saveReview(draft(1, "compra")));

    expect(await read("products/p1")).toMatchObject({ rating: 3, ratingCount: 3 });
    expect(await read("reviews/ana_p1")).toMatchObject({ rating: 1, orderId: "compra" });
  });

  it("saveReview edita sin cambiar el contador", async () => {
    useServicesAs("ana");
    await assertSucceeds(saveReview(draft(1, "compra")));
    await assertSucceeds(saveReview(draft(4, "compra"), "ana_p1"));

    expect(await read("products/p1")).toMatchObject({ rating: 4, ratingCount: 3 });
    expect(await read("reviews/ana_p1")).toMatchObject({ rating: 4 });
  });

  it("acepta promedios redondeados en ediciones sucesivas", async () => {
    await seed("products/p1", { name: "Zapa", price: 100, stock: 5, rating: 4.67, ratingCount: 3 });
    useServicesAs("ana");
    await assertSucceeds(saveReview(draft(2, "compra")));
    await assertSucceeds(saveReview(draft(5, "compra"), "ana_p1"));
    await assertSucceeds(saveReview(draft(3, "compra"), "ana_p1"));

    expect(await read("products/p1")).toMatchObject({ ratingCount: 4 });
  });

  it("saveReview migra una reseña con ID antiguo", async () => {
    await seed("reviews/antigua", {
      productId: "p1", userId: "ana", userName: "Ana", rating: 2, comment: "Vieja", createdAt: new Date(),
    });
    await seed("products/p1", { name: "Zapa", price: 100, stock: 5, rating: 3, ratingCount: 2 });
    useServicesAs("ana");
    await assertSucceeds(saveReview(draft(4, "compra"), "antigua"));

    expect(await read("reviews/antigua")).toBeUndefined();
    expect(await read("reviews/ana_p1")).toMatchObject({ rating: 4 });
    expect(await read("products/p1")).toMatchObject({ rating: 4, ratingCount: 2 });
  });

  it("rechaza reseñar sin compra", async () => {
    useServicesAs("beto");
    await assertFails(saveReview({ ...draft(5, "compra"), userId: "beto", userName: "Beto" }));
  });
});

describe("abuso de rating", () => {
  it("rechaza cambiar el promedio sin reseña", async () => {
    await assertFails(updateDoc(doc(as("beto"), "products/p1"), { rating: 1, ratingCount: 999 }));
  });

  it("rechaza cambiar el promedio con una reseña que no se escribe en la transacción", async () => {
    await seed("reviews/ana_p1", { ...reviewData("ana", "p1", 5, "compra"), createdAt: new Date() });
    await assertFails(updateDoc(doc(as("ana"), "products/p1"), { rating: 1, ratingCount: 2 }));
  });

  it("rechaza un promedio que no coincide con la reseña nueva", async () => {
    const db = as("ana");
    const batch = writeBatch(db);
    batch.set(doc(db, "reviews/ana_p1"), reviewData("ana", "p1", 5, "compra"));
    batch.update(doc(db, "products/p1"), { rating: 1, ratingCount: 3 });
    await assertFails(batch.commit());
  });

  it("rechaza inflar el contador", async () => {
    const db = as("ana");
    const batch = writeBatch(db);
    batch.set(doc(db, "reviews/ana_p1"), reviewData("ana", "p1", 4, "compra"));
    batch.update(doc(db, "products/p1"), { rating: 4, ratingCount: 50 });
    await assertFails(batch.commit());
  });

  it("rechaza un promedio falso al editar", async () => {
    await seed("reviews/ana_p1", { ...reviewData("ana", "p1", 4, "compra"), createdAt: new Date() });
    const db = as("ana");
    const batch = writeBatch(db);
    batch.update(doc(db, "reviews/ana_p1"), { rating: 5, updatedAt: serverTimestamp() });
    batch.update(doc(db, "products/p1"), { rating: 1, ratingCount: 2 });
    await assertFails(batch.commit());
  });

  it("limita cuánto puede mover el promedio el camino de migración", async () => {
    const db = as("ana");
    const batch = writeBatch(db);
    batch.set(doc(db, "reviews/ana_p1"), reviewData("ana", "p1", 5, "compra"));
    batch.update(doc(db, "products/p1"), { rating: 1, ratingCount: 2 });
    await assertFails(batch.commit());
  });
});

describe("borrado de reseñas", () => {
  beforeEach(async () => {
    await seed("reviews/ana_p1", { ...reviewData("ana", "p1", 4, "compra"), createdAt: new Date() });
    await seed("reviews/antigua", {
      productId: "p2", userId: "ana", userName: "Ana", rating: 2, comment: "Vieja", createdAt: new Date(),
    });
  });

  it("el autor no puede borrar su reseña actual", async () => {
    await assertFails(deleteDoc(doc(as("ana"), "reviews/ana_p1")));
  });

  it("el autor puede borrar una reseña con ID antiguo", async () => {
    await assertSucceeds(deleteDoc(doc(as("ana"), "reviews/antigua")));
  });

  it("otra persona no puede borrarla", async () => {
    await assertFails(deleteDoc(doc(as("beto"), "reviews/antigua")));
  });

  it("el admin puede borrarla", async () => {
    await assertSucceeds(deleteDoc(doc(as("admin"), "reviews/ana_p1")));
  });
});

describe("admin", () => {
  it("puede editar stock y precio libremente", async () => {
    await assertSucceeds(updateDoc(doc(as("admin"), "products/p1"), { stock: 50, price: 120 }));
  });
});
