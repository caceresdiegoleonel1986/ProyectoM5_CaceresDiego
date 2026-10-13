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
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { orderConverter } from "./converters/orderConverter";
import type { Order, OrderItem, OrderStatusHistory, ShippingAddress } from "../types/order.types";

const ordersRef = collection(db, "orders").withConverter(orderConverter);
type CreateOrderPayload = {
  items: Array<Pick<OrderItem, "productId" | "quantity">>;
  shippingAddress: ShippingAddress;
};

const createOrderCallable = httpsCallable<CreateOrderPayload, { id: string }>(functions, "createOrder");

export async function createOrder(
  items: OrderItem[],
  shippingAddress: ShippingAddress
): Promise<{ id: string }> {
  if (!items.length) {
    throw new Error("El carrito está vacío.");
  }

  const result = await createOrderCallable({
    items: items.map(({ productId, quantity }) => ({ productId, quantity })),
    shippingAddress,
  });
  return result.data;
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
  status: Order["status"],
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