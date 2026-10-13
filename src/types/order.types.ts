export interface OrderItem {
  productId: string;
  name: string;
  priceAtPurchase: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderStatusHistory {
  status: "created" | "paid" | "cancelled";
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

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  status: "created" | "paid" | "cancelled";
  history: OrderStatusHistory[];
  shippingAddress?: ShippingAddress;
}