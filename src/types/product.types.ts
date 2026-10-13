export type CategoryId =
  | "zapatillas"
  | "mochilas"
  | "auriculares"
  | "smartwatches"
  | "camperas";

export interface Category {
  id: CategoryId;
  name: string;
  description?: string;
}

export interface Product {
  id: string;                // ID del documento en Firestore
  name: string;              // Nombre visible del producto
  nameLower: string;         // Nombre en minúsculas para búsquedas
  description: string;       // Descripción corta
  price: number;             // Precio en la moneda definida
  stock: number;             // Cantidad disponible
  imageUrl?: string;         // URL de la imagen
  categoryId: CategoryId;    // Relación con la categoría
  rating?: number;           // Promedio de calificación (1 - 5)
  ratingCount?: number;      // Cantidad de reviews
  createdAt: Date;           // Fecha de creación
  updatedAt?: Date;          // Fecha de última actualización
}