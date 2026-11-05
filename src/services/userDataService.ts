import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getProductsByIds } from "./productService";
import type { CartItem } from "../types/cartItem.types";

/** En la base solo se guarda la referencia: precio y stock se leen actualizados del producto. */
export type CartEntry = { productId: string; quantity: number };

function isCartEntry(value: unknown): value is CartEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<CartEntry>;
  return typeof entry.productId === "string" && Number.isInteger(entry.quantity) && Number(entry.quantity) > 0;
}

/** Devuelve lo guardado y los ítems utilizables; omite productos eliminados o agotados y ajusta la cantidad al stock. */
export async function loadCart(userId: string): Promise<{ entries: CartEntry[]; items: CartItem[] }> {
  const snapshot = await getDoc(doc(db, "carts", userId));
  const stored: unknown = snapshot.data()?.items;
  const entries = Array.isArray(stored) ? stored.filter(isCartEntry) : [];
  const products = await getProductsByIds(entries.map((entry) => entry.productId));

  const items = products.flatMap((product): CartItem[] => {
    const entry = entries.find(({ productId }) => productId === product.id);
    if (!entry || product.stock <= 0) return [];
    return [{ product, quantity: Math.min(entry.quantity, product.stock) }];
  });
  return { entries, items };
}

export async function saveCart(userId: string, entries: CartEntry[]): Promise<void> {
  await setDoc(doc(db, "carts", userId), { items: entries, updatedAt: serverTimestamp() });
}

export async function loadFavorites(userId: string): Promise<string[]> {
  const snapshot = await getDoc(doc(db, "favorites", userId));
  const stored: unknown = snapshot.data()?.productIds;
  return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
}

export async function saveFavorites(userId: string, productIds: string[]): Promise<void> {
  await setDoc(doc(db, "favorites", userId), { productIds, updatedAt: serverTimestamp() });
}
