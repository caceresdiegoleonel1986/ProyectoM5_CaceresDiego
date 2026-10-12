import type { FirestoreDataConverter, QueryDocumentSnapshot, WithFieldValue } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import type { Order } from "../../types/order.types";

export const orderConverter: FirestoreDataConverter<Order> = {
  toFirestore(order: WithFieldValue<Order>) {
    return {
      userId: order.userId,
      items: order.items,
      total: order.total,
      createdAt:
        order.createdAt instanceof Date
          ? Timestamp.fromDate(order.createdAt)
          : order.createdAt instanceof Timestamp
          ? order.createdAt
          : Timestamp.now(),
      status: order.status ?? "created",
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Order {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      items: data.items,
      total: data.total,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt ?? Date.now()),
      status: data.status || "created",
    };
  },
};