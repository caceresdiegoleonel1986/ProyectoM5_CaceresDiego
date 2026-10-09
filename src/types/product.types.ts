export type CategoryId =
  | "zapatillas"
  | "mochilas"
  | "auriculares"
  | "smartwatches"
  | "camperas";

// Interfaz principal del producto
export interface Product {
  id: string;                // ID del documento en Firestore
  name: string;              // Nombre visible del producto
  nameLower: string;         // Nombre en minúsculas para búsquedas
  description: string;       // Descripción corta
  price: number;             // Precio en la moneda definida
  stock: number;             // Cantidad disponible
  imageUrl?: string;         // URL de la imagen (opcional)
  categoryId: CategoryId;    // Relación con la categoría
  createdAt: Date;           // Fecha de creación
  updatedAt?: Date;          // Fecha de última actualización (opcional)
}