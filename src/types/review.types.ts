export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 a 5 estrellas
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
  orderId?: string;
  orderItemIndex?: number;
}

export interface ReviewPurchase {
  orderId: string;
  orderItemIndex: number;
}
