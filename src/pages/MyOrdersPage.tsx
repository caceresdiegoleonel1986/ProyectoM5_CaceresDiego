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
    <section className="page">
      <h1>Mis pedidos</h1>
      <ul className="orders-list">
        {orders.map((order) => (
          <li className="order-card" key={order.id}>
            <div className="order-card__head">
              <strong>Pedido {order.id}</strong>
              <span className={`status-badge status-badge--${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span>
            </div>
            <p>{order.createdAt.toLocaleDateString()} · ${order.total.toFixed(2)}</p>
            <details>
              <summary>Ver detalle</summary>
              <ul className="order-item-list">
                {order.items.map((item) => (
                  <li className="order-item" key={item.productId}>
                    {item.imageUrl ? (
                      <img className="order-item__thumbnail" src={item.imageUrl} alt={item.name} />
                    ) : (
                      <span className="order-item__thumbnail order-item__thumbnail--empty" role="img" aria-label={`Imagen no disponible para ${item.name}`} />
                    )}
                    <span className="order-item__text">
                      {item.name} × {item.quantity} — ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              {order.shippingAddress && (
                <p>
                  Envío a {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city} ({order.shippingAddress.postalCode})
                </p>
              )}
              {order.payment && <p>Pago simulado con tarjeta terminada en {order.payment.cardLast4}</p>}
              <h3>Historial</h3>
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