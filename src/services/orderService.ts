import {
  collection,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { orderConverter } from "./converters/orderConverter";
import type { Order, OrderItem, OrderStatus, OrderStatusHistory, ShippingAddress, SimulatedPayment } from "../types/order.types";

const ordersRef = collection(db, "orders").withConverter(orderConverter);

export type OrderBuyer = { id: string; email?: string; displayName?: string };

/**
 * Crea la orden y descuenta stock en una transacción de Firestore (plan Spark, sin Functions).
 * Precio y stock se leen dentro de la transacción; el total no viene del carrito del cliente.
 */
export async function createOrder(
  items: OrderItem[],
  shippingAddress: ShippingAddress,
  buyer: OrderBuyer,
  payment: SimulatedPayment
): Promise<{ id: string }> {
  if (!items.length) {
    throw new Error("El carrito está vacío.");
  }

  const quantities = new Map<string, number>();
  for (const { productId, quantity } of items) {
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }

  const orderRef = doc(collection(db, "orders"));
  await runTransaction(db, async (tx) => {
    const snaps = await Promise.all(
      [...quantities.keys()].map((productId) => tx.get(doc(db, "products", productId)))
    );

    let total = 0;
    const orderItems: OrderItem[] = snaps.map((snap) => {
      const data = snap.data();
      const quantity = quantities.get(snap.id) ?? 0;
      if (!data) throw new Error("Un producto del carrito ya no está disponible.");
      if (typeof data.stock !== "number" || data.stock < quantity) {
        throw new Error(`Stock insuficiente para ${data.name}.`);
      }
      total += data.price * quantity;
      tx.update(snap.ref, { stock: data.stock - quantity });
      return {
        productId: snap.id,
        name: data.name,
        priceAtPurchase: data.price,
        quantity,
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
      };
    });

    tx.set(orderRef, {
      userId: buyer.id,
      userEmail: buyer.email ?? "",
      customerName: shippingAddress.fullName || buyer.displayName || "",
      items: orderItems,
      total,
      status: "pending",
      history: [{ status: "pending", changedAt: Timestamp.now(), note: "Orden creada, pago simulado aprobado" }],
      shippingAddress,
      payment,
      createdAt: serverTimestamp(),
    });
  });

  return { id: orderRef.id };
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(ordersRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((orderDoc) => orderDoc.data());
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const docRef = doc(db, "orders", orderId).withConverter(orderConverter);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<void> {
  const docRef = doc(db, "orders", orderId).withConverter(orderConverter);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error("Orden no encontrada");
  }

  const order = snap.data();
  const newHistory: OrderStatusHistory[] = [
    ...(order.history || []),
    {
      status,
      changedAt: new Date(),
      note: note || `Estado actualizado a ${status}`,
    },
  ];

  await updateDoc(doc(db, "orders", orderId), {
    status,
    history: newHistory.map((h) => ({
      status: h.status,
      changedAt: Timestamp.fromDate(h.changedAt),
      note: h.note || "",
    })),
  });
}