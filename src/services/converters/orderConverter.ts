import type { FirestoreDataConverter, QueryDocumentSnapshot, WithFieldValue } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import type { Order, OrderStatusHistory } from "../../types/order.types";

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
      status: order.status ?? "created",
      history,
      shippingAddress: order.shippingAddress ?? null,
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
    const history: OrderStatusHistory[] = historyData.map((h: { status?: Order["status"]; changedAt?: { toDate?: () => Date } | string | number; note?: string }) => ({
      status: h.status || "created",
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
      status: data.status || "created",
      history,
      shippingAddress: data.shippingAddress ?? undefined,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt ?? Date.now()),
    };
  },
};