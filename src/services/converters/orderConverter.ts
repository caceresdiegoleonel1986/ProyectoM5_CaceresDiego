import type { FirestoreDataConverter, QueryDocumentSnapshot, WithFieldValue } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import type { Order, OrderStatus, OrderStatusHistory } from "../../types/order.types";
import { ORDER_STATUSES } from "../../types/order.types";

const legacyStatuses: Record<string, OrderStatus> = { created: "pending", paid: "completed" };

/** Normaliza estados guardados por versiones anteriores (created/paid). */
function normalizeStatus(value: unknown): OrderStatus {
  if (typeof value !== "string") return "pending";
  const known = ORDER_STATUSES.find((status) => status === value);
  return known ?? legacyStatuses[value] ?? "pending";
}

export const orderConverter: FirestoreDataConverter<Order> = {
  toFirestore(order: WithFieldValue<Order>) {
    const history = Array.isArray(order.history)
      ? (order.history as OrderStatusHistory[]).map((h) => ({
          status: h.status,
          changedAt:
            h.changedAt instanceof Date
              ? Timestamp.fromDate(h.changedAt)
              : Timestamp.now(),
          note: h.note ?? "",
        }))
      : [];

    return {
      userId: order.userId,
      userEmail: order.userEmail ?? "",
      customerName: order.customerName ?? "",
      items: order.items,
      total: order.total,
      status: order.status ?? "pending",
      history,
      shippingAddress: order.shippingAddress ?? null,
      payment: order.payment ?? null,
      createdAt:
        order.createdAt instanceof Date
          ? Timestamp.fromDate(order.createdAt)
          : order.createdAt instanceof Timestamp
          ? order.createdAt
          : Timestamp.now(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Order {
    const data = snapshot.data();
    const historyData = Array.isArray(data.history) ? data.history : [];
    const history: OrderStatusHistory[] = historyData.map((h: { status?: unknown; changedAt?: { toDate?: () => Date } | string | number; note?: string }) => ({
      status: normalizeStatus(h.status),
      changedAt:
        h.changedAt && typeof h.changedAt === "object" && "toDate" in h.changedAt && typeof h.changedAt.toDate === "function"
          ? h.changedAt.toDate()
          : new Date(typeof h.changedAt === "string" || typeof h.changedAt === "number" ? h.changedAt : Date.now()),
      note: h.note,
    }));

    return {
      id: snapshot.id,
      userId: data.userId ?? "",
      userEmail: data.userEmail,
      customerName: data.customerName,
      items: data.items ?? [],
      total: Number(data.total ?? 0),
      status: normalizeStatus(data.status),
      history,
      shippingAddress: data.shippingAddress ?? undefined,
      payment: data.payment ?? undefined,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt ?? Date.now()),
    };
  },
};