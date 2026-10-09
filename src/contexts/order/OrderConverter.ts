import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import type { Order, OrderItem, OrderStatusHistory } from "../types/order.types";

export const orderConverter: FirestoreDataConverter<Order> = {
  toFirestore(order: Order) {
    return {
      userId: order.userId,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt instanceof Date ? Timestamp.fromDate(order.createdAt) : order.createdAt,
      status: order.status,
      history: order.history.map((h: OrderStatusHistory) => ({
        status: h.status,
        changedAt: h.changedAt instanceof Date ? Timestamp.fromDate(h.changedAt) : h.changedAt,
      })),
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Order {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      userId: data.userId,
      items: data.items as OrderItem[],
      total: data.total,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      status: data.status,
      history: (data.history ?? []).map((h: any) => ({
        status: h.status,
        changedAt: h.changedAt instanceof Timestamp ? h.changedAt.toDate() : h.changedAt,
      })),
    };
  },
};