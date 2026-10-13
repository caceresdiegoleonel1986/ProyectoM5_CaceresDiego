import type { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import type { Product, CategoryId } from "../../types/product.types";

export const productConverter: FirestoreDataConverter<Product> = {
  toFirestore(product: Product) {
    return {
      name: product.name,
      nameLower: product.nameLower ?? product.name.toLowerCase(),
      description: product.description ?? "",
      price: product.price,
      stock: product.stock ?? 0,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl ?? null,
      rating: product.rating ?? 5,
      ratingCount: product.ratingCount ?? 0,
      createdAt:
        product.createdAt instanceof Date
          ? Timestamp.fromDate(product.createdAt)
          : product.createdAt,
      ...(product.updatedAt
        ? {
            updatedAt:
              product.updatedAt instanceof Date
                ? Timestamp.fromDate(product.updatedAt)
                : product.updatedAt,
          }
        : {}),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Product {
    const data = snapshot.data();
    if (typeof data.name !== "string" || typeof data.price !== "number") {
      throw new Error(
        `[productConverter] Documento inválido o incompleto, id: ${snapshot.id}`
      );
    }
    return {
      id: snapshot.id,
      name: data.name,
      nameLower: data.nameLower || data.name.toLowerCase(),
      description: data.description || "",
      price: data.price,
      stock: typeof data.stock === "number" ? data.stock : 0,
      categoryId: (data.categoryId || data.category || "zapatillas") as CategoryId,
      imageUrl: data.imageUrl || undefined,
      rating: typeof data.rating === "number" ? data.rating : 5,
      ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : 0,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt ?? Date.now()),
      updatedAt:
        data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    };
  },
};