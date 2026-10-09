export interface OrderItem {
  productId: string;
  name: string;
  priceAtPurchase: number;
  quantity: number;
}

export interface OrderStatusHistory {
  status: "created" | "paid" | "cancelled";
  changedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  status: "created" | "paid" | "cancelled";
  history: OrderStatusHistory[];
}