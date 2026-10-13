import {
  collection,
  addDoc,
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

export async function addReview(reviewData: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const now = new Date();
  const docRef = await addDoc(collection(db, "reviews"), {
    ...reviewData,
    createdAt: Timestamp.fromDate(now),
  });

  return {
    ...reviewData,
    id: docRef.id,
    createdAt: now,
  };
}
