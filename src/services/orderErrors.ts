export type OrderPriceChange = { productId: string; name: string; price: number };

/** El precio actual de Firestore difiere del que el cliente vio al confirmar la compra. */
export class OrderPriceChangedError extends Error {
  readonly changes: OrderPriceChange[];

  constructor(changes: OrderPriceChange[]) {
    const names = changes.map((change) => change.name).join(", ");
    super(`Cambió el precio de ${names}. Revisa el nuevo total y confirma de nuevo.`);
    this.name = "OrderPriceChangedError";
    this.changes = changes;
  }
}
