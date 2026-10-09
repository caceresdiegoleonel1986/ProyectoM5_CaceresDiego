import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { orderConverter } from "./converters/orderConverter";
import type { Order, OrderItem } from "../types/order.types";

const ordersRef = collection(db, "orders").withConverter(orderConverter);
const productsRef = collection(db, "products");

// Crear orden con validación de stock y usuario
export async function createOrder(userId: string, items: OrderItem[], total: number): Promise<Order> {
  if (!userId || !items.length || total <= 0) {
    throw new Error("[createOrder] Input inválido, revisa userId/items/total.");
  }

  return await runTransaction(db, async (transaction) => {
    // Validar stock de cada producto
    for (const item of items) {
      const productRef = doc(productsRef, item.productId);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Producto ${item.productId} no existe`);
      }
      const productData = productSnap.data() as any;
      if (productData.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${item.name}`);
      }
      // Descontar stock
      transaction.update(productRef, { stock: productData.stock - item.quantity });
    }

    // Crear referencia con ID generado
    const orderRef = doc(ordersRef);

    const orderRaw: Omit<Order, "id"> = {
      userId,
      items,
      total,
      createdAt: serverTimestamp(),
      status: "created",
      history: [{ status: "created", changedAt: new Date() }],
    };

    transaction.set(orderRef, orderRaw);

    // Devolver la orden con su id incluido
    return { id: orderRef.id, ...orderRaw };
  });
}

// Obtener todas las órdenes
export async function getAllOrders(): Promise<Order[]> {
  const snap = await getDocs(ordersRef);
  return snap.docs.map(d => d.data());
}

// Obtener órdenes por usuario
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const q = query(ordersRef, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// Obtener una orden específica
export async function getOrderById(orderId: string): Promise<Order | null> {
  const docRef = doc(db, "orders", orderId).withConverter(orderConverter);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data()! : null;
}

// Actualizar estado de una orden y registrar historial
export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  const docRef = doc(db, "orders", orderId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Orden no encontrada");

  const order = snap.data() as Order;
  const newHistory = [...order.history, { status, changedAt: new Date() }];

  await updateDoc(docRef, {
    status,
    history: newHistory,
  });
}