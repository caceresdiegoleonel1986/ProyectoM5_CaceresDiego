import React, { useState } from "react";
import { useCart } from "../contexts/cart/useCart";
import type { OrderItem } from "../types/order.types";

export const CheckoutPage: React.FC<{ userId: string }> = ({ userId }) => {
  const { items, checkout } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = await checkout(userId);
      setOrderId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return <p>✅ ¡Orden creada! Tu número de orden es <strong>{orderId}</strong></p>;
  }

  return (
    <div>
      <h2>Checkout</h2>
      <ul>
        {items.map(item => (
          <li key={item.productId}>
            {item.name} x {item.quantity} — ${item.priceAtPurchase}
          </li>
        ))}
      </ul>
      <button onClick={handleCheckout} disabled={loading || !items.length}>
        {loading ? "Procesando..." : "Confirmar compra"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};