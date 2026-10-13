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
} from "firebase/firestore";
import { db } from "./firebase";
import type { Review } from "../types/review.types";

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        productId: data.productId,
        userId: data.userId,
        userName: data.userName,
        rating: data.rating,
        comment: data.comment,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt ?? Date.now()),
      };
    });
  } catch (err) {
    console.warn("Consulta con orderBy falló, intentando sin ordenamiento:", err);
    const fallbackQ = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      limit(50)
    );
    const snap = await getDocs(fallbackQ);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        productId: data.productId,
        userId: data.userId,
        userName: data.userName,
        rating: data.rating,
        comment: data.comment,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt ?? Date.now()),
      };
    });
  }
}

/** Guarda la review y actualiza el promedio del producto en una sola transacción. */
export async function addReview(reviewData: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const now = new Date();
  const reviewRef = doc(collection(db, "reviews"));
  const productRef = doc(db, "products", reviewData.productId);

  await runTransaction(db, async (tx) => {
    const product = await tx.get(productRef);
    if (!product.exists()) throw new Error("El producto ya no existe.");
    const count: number = product.data().ratingCount ?? 0;
    const average: number = product.data().rating ?? 0;
    const nextCount = count + 1;

    tx.set(reviewRef, { ...reviewData, createdAt: Timestamp.fromDate(now) });
    tx.update(productRef, {
      rating: Math.round(((average * count + reviewData.rating) / nextCount) * 100) / 100,
      ratingCount: nextCount,
    });
  });

  return {
    ...reviewData,
    id: reviewRef.id,
    createdAt: now,
  };
}
