import { useState, type FormEvent } from "react";
import { useCart } from "../contexts/cart/useCart";
import { useAuth } from "../contexts/auth/useAuth";
import { createOrder } from "../services/orderService";
import type { ShippingAddress } from "../types/order.types";
import Spinner from "../components/ui/Spinner";

export function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.displayName ?? "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Inicia sesión para confirmar tu compra.");
      const order = await createOrder(
        items.map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          priceAtPurchase: product.price,
          quantity,
          imageUrl: product.imageUrl,
        })),
        shippingAddress,
      );
      setOrderId(order.id);
      clearCart();
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
          <li key={item.product.id}>
            {item.product.name} x {item.quantity} — ${item.product.price}
          </li>
        ))}
      </ul>
      {!user && <p>Inicia sesión antes de realizar el pedido.</p>}
      <form className="mt-6 grid max-w-xl gap-3" onSubmit={(event) => void handleCheckout(event)}>
        <h3>Dirección de envío</h3>
        <label className="grid gap-1">Nombre completo
          <input
            autoComplete="name"
            required
            maxLength={100}
            value={shippingAddress.fullName}
            onChange={(event) => setShippingAddress({ ...shippingAddress, fullName: event.target.value })}
          />
        </label>
        <label className="grid gap-1">Dirección
          <input
            autoComplete="street-address"
            required
            maxLength={200}
            value={shippingAddress.address}
            onChange={(event) => setShippingAddress({ ...shippingAddress, address: event.target.value })}
          />
        </label>
        <label className="grid gap-1">Ciudad
          <input
            autoComplete="address-level2"
            required
            maxLength={100}
            value={shippingAddress.city}
            onChange={(event) => setShippingAddress({ ...shippingAddress, city: event.target.value })}
          />
        </label>
        <label className="grid gap-1">Código postal
          <input
            autoComplete="postal-code"
            required
            maxLength={20}
            value={shippingAddress.postalCode}
            onChange={(event) => setShippingAddress({ ...shippingAddress, postalCode: event.target.value })}
          />
        </label>
        <label className="grid gap-1">Teléfono
          <input
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={shippingAddress.phone}
            onChange={(event) => setShippingAddress({ ...shippingAddress, phone: event.target.value })}
          />
        </label>
        <button type="submit" disabled={loading || !items.length || !user}>
          {loading ? <><Spinner size="sm" /> Confirmando compra…</> : "Confirmar compra"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default CheckoutPage;