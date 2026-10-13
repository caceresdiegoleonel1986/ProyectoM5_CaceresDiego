export const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export interface OrderItem {
  productId: string;
  name: string;
  priceAtPurchase: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  changedAt: Date;
  note?: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
}

/** Pago simulado: no se procesa ningún cobro ni se guarda el número completo de tarjeta. */
export interface SimulatedPayment {
  method: "simulated-card";
  cardLast4: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  status: OrderStatus;
  history: OrderStatusHistory[];
  shippingAddress?: ShippingAddress;
  payment?: SimulatedPayment;
}
