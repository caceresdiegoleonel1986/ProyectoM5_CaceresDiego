import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth/useAuth";
import { getOrdersByUser } from "../services/orderService";
import type { Order } from "../types/order.types";
import { ORDER_STATUS_LABELS } from "../types/order.types";
import { EmptyState, ErrorState, LoadingState } from "../components/states";

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getOrdersByUser(user.id)
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar tus pedidos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (orders.length === 0) {
    return <EmptyState title="Todavía no tienes pedidos" />;
  }

  return (
    <section className="mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-2xl font-semibold">Mis pedidos</h1>
      <ul className="grid gap-4">
        {orders.map((order) => (
          <li className="border-b border-[var(--border)] pb-4" key={order.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <strong>Pedido {order.id}</strong>
              <span>{ORDER_STATUS_LABELS[order.status]}</span>
            </div>
            <p>{order.createdAt.toLocaleDateString()} · ${order.total.toFixed(2)}</p>
            <details className="mt-2">
              <summary className="cursor-pointer">Ver detalle</summary>
              <ul className="mt-2">
                {order.items.map((item) => (
                  <li key={item.productId}>
                    {item.name} × {item.quantity} — ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
              {order.shippingAddress && (
                <p className="mt-2">
                  Envío a {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city} ({order.shippingAddress.postalCode})
                </p>
              )}
              {order.payment && <p>Pago simulado con tarjeta terminada en {order.payment.cardLast4}</p>}
              <h3 className="mt-2 font-semibold">Historial</h3>
              <ol>
                {order.history.map((entry) => (
                  <li key={`${entry.status}-${entry.changedAt.getTime()}`}>
                    {entry.changedAt.toLocaleString()} · {ORDER_STATUS_LABELS[entry.status]}
                  </li>
                ))}
              </ol>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}