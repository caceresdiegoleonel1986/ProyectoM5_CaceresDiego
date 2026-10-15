import {
  collection,
  doc,
  runTransaction,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getOrdersByUser } from "./orderService";
import type { Review, ReviewPurchase } from "../types/review.types";

export type ReviewDraft = Omit<Review, "id" | "createdAt" | "updatedAt" | "orderId" | "orderItemIndex"> & ReviewPurchase;

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(typeof value === "string" || typeof value === "number" ? value : Date.now());
}

function toReview(id: string, data: Record<string, unknown>): Review {
  return {
    id,
    productId: data.productId as string,
    userId: data.userId as string,
    userName: data.userName as string,
    rating: data.rating as number,
    comment: data.comment as string,
    createdAt: toDate(data.createdAt),
    ...(data.updatedAt ? { updatedAt: toDate(data.updatedAt) } : {}),
    ...(typeof data.orderId === "string" ? { orderId: data.orderId } : {}),
    ...(typeof data.orderItemIndex === "number" ? { orderItemIndex: data.orderItemIndex } : {}),
  };
}

function uniqueReviewsByUser(reviews: Review[]): Review[] {
  reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const seen = new Set<string>();
  return reviews.filter((review) => {
    if (seen.has(review.userId)) return false;
    seen.add(review.userId);
    return true;
  });
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return uniqueReviewsByUser(snap.docs.map((d) => toReview(d.id, d.data())));
  } catch (err) {
    console.warn("Consulta con orderBy falló, intentando sin ordenamiento:", err);
    const fallbackQ = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      limit(50)
    );
    const snap = await getDocs(fallbackQ);
    return uniqueReviewsByUser(snap.docs.map((d) => toReview(d.id, d.data())));
  }
}

export async function getReviewablePurchase(productId: string, userId: string): Promise<ReviewPurchase | null> {
  const orders = await getOrdersByUser(userId);
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const orderItemIndex = order.items.findIndex((item) => item.productId === productId);
    if (orderItemIndex >= 0) return { orderId: order.id, orderItemIndex };
  }
  return null;
}

/** Creates or edits a purchase-verified review and updates the product aggregate atomically. */
export async function saveReview(reviewData: ReviewDraft, existingReviewId?: string): Promise<Review> {
  const now = new Date();
  const reviewRef = doc(db, "reviews", `${reviewData.userId}_${reviewData.productId}`);
  const previousReviewRef = existingReviewId && existingReviewId !== reviewRef.id
    ? doc(db, "reviews", existingReviewId)
    : null;
  const productRef = doc(db, "products", reviewData.productId);
  const orderRef = doc(db, "orders", reviewData.orderId);

  return runTransaction(db, async (tx) => {
    const refs = [productRef, orderRef, reviewRef];
    if (previousReviewRef) refs.push(previousReviewRef);
    const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
    const [productSnapshot, orderSnapshot, reviewSnapshot] = snapshots;
    const previousSnapshot = previousReviewRef ? snapshots[3] : null;
    if (!productSnapshot.exists()) throw new Error("El producto ya no existe.");
    if (!orderSnapshot.exists()) throw new Error("No se encontró la compra de este producto.");

    const order = orderSnapshot.data();
    const orderItems = Array.isArray(order.items) ? order.items as Array<{ productId?: string }> : [];
    if (
      order.userId !== reviewData.userId
      || order.status === "cancelled"
      || orderItems[reviewData.orderItemIndex]?.productId !== reviewData.productId
    ) {
      throw new Error("Solo puedes reseñar productos de una compra propia no cancelada.");
    }

    if (previousSnapshot?.exists() && reviewSnapshot.exists()) {
      throw new Error("Ya existen varias reseñas tuyas para este producto. Contacta con soporte.");
    }

    const currentSnapshot = previousSnapshot?.exists() ? previousSnapshot : reviewSnapshot.exists() ? reviewSnapshot : null;
    const currentData = currentSnapshot?.data() as Record<string, unknown> | undefined;
    if (currentData && (currentData.userId !== reviewData.userId || currentData.productId !== reviewData.productId)) {
      throw new Error("No puedes editar la reseña de otra persona.");
    }

    const productData = productSnapshot.data();
    const count: number = productData.ratingCount ?? 0;
    const average: number = productData.rating ?? 0;
    const previousRating = currentData ? Number(currentData.rating) : 0;
    const nextCount = currentData ? count : count + 1;
    const nextRating = Math.round(((average * count - previousRating + reviewData.rating) / nextCount) * 100) / 100;

    if (reviewSnapshot.exists()) {
      tx.update(reviewRef, {
        rating: reviewData.rating,
        comment: reviewData.comment,
        orderId: reviewData.orderId,
        orderItemIndex: reviewData.orderItemIndex,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(reviewRef, {
        ...reviewData,
        createdAt: serverTimestamp(),
        ...(currentData ? { updatedAt: serverTimestamp() } : {}),
      });
      if (previousSnapshot?.exists() && previousReviewRef) tx.delete(previousReviewRef);
    }
    tx.update(productRef, {
      rating: nextRating,
      ratingCount: nextCount,
    });

    return {
      ...reviewData,
      id: reviewRef.id,
      createdAt: currentData && reviewSnapshot.exists() ? toDate(currentData.createdAt) : now,
      ...(currentData ? { updatedAt: now } : {}),
    };
  });
}
