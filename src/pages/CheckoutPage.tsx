import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EmptyState, LoadingState } from "../components/states";
import { useCart } from "../contexts/cart/useCart";
import { useAuth } from "../contexts/auth/useAuth";
import { createOrder } from "../services/orderService";
import { OrderPriceChangedError } from "../services/orderErrors";
import { loadShippingAddress, saveShippingAddress } from "../services/userDataService";
import { simulatePayment, type CardDetails } from "../services/paymentService";
import type { ShippingAddress } from "../types/order.types";
import Spinner from "../components/ui/Spinner";
import { formatPrice } from "../utils/formatPrice";

export function CheckoutPage() {
  const { items, clearCart, totalPrice, syncing, updatePrices } = useCart();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardDetails>({ number: "", expiry: "", cvc: "" });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.displayName ?? "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });
  const addressEdited = useRef(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void loadShippingAddress(userId)
      .then((saved) => {
        // Si ya empezó a escribir, no se pisa lo que puso.
        if (active && saved && !addressEdited.current) setShippingAddress(saved);
      })
      .catch((cause: unknown) => console.error("No se pudo cargar la dirección guardada:", cause));
    return () => {
      active = false;
    };
  }, [userId]);

  const updateAddress = (changes: Partial<ShippingAddress>) => {
    addressEdited.current = true;
    setShippingAddress((current) => ({ ...current, ...changes }));
  };

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Inicia sesión para confirmar tu compra.");
      const payment = await simulatePayment(card);
      const order = await createOrder(
        items.map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          priceAtPurchase: product.price,
          quantity,
          imageUrl: product.imageUrl,
        })),
        shippingAddress,
        { id: user.id, email: user.email, displayName: user.displayName },
        payment,
      );
      setOrderId(order.id);
      clearCart();
      // La orden ya está creada: si falla guardar la dirección, la compra no se ve afectada.
      void saveShippingAddress(user.id, shippingAddress)
        .catch((cause: unknown) => console.error("No se pudo guardar la dirección:", cause));
    } catch (err) {
      if (err instanceof OrderPriceChangedError) updatePrices(err.changes);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return (
      <p role="status" className="notice notice--success">
        ✅ ¡Pago aprobado y orden creada! Tu número de orden es <strong>{orderId}</strong>.{" "}
        <Link to="/mis-pedidos">Ver mis pedidos</Link>
      </p>
    );
  }

  if (items.length === 0) {
    if (syncing) return <LoadingState />;
    return <EmptyState title="Tu carrito está vacío" description="Agrega productos antes de continuar al checkout." />;
  }

  return (
    <div className="page">
      <section className="panel">
        <h2>Revisa tu pedido</h2>
        <ul className="summary-list">
          {items.map(item => (
            <li key={item.product.id}>
              {item.product.name} x {item.quantity} — {formatPrice(item.product.price * item.quantity)}
            </li>
          ))}
        </ul>
        <p className="checkout-total">Total: {formatPrice(totalPrice)}</p>
        {!user && <p>Inicia sesión antes de realizar el pedido.</p>}
      </section>
      <form className="panel form-grid" onSubmit={(event) => void handleCheckout(event)}>
        <h3>Dirección de envío</h3>
        <label>Nombre completo
          <input
            autoComplete="name"
            required
            maxLength={100}
            value={shippingAddress.fullName}
            onChange={(event) => updateAddress({ fullName: event.target.value })}
          />
        </label>
        <label>Dirección
          <input
            autoComplete="street-address"
            required
            maxLength={200}
            value={shippingAddress.address}
            onChange={(event) => updateAddress({ address: event.target.value })}
          />
        </label>
        <label>Ciudad
          <input
            autoComplete="address-level2"
            required
            maxLength={100}
            value={shippingAddress.city}
            onChange={(event) => updateAddress({ city: event.target.value })}
          />
        </label>
        <label>Código postal
          <input
            autoComplete="postal-code"
            required
            maxLength={20}
            value={shippingAddress.postalCode}
            onChange={(event) => updateAddress({ postalCode: event.target.value })}
          />
        </label>
        <label>Teléfono
          <input
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={shippingAddress.phone}
            onChange={(event) => updateAddress({ phone: event.target.value })}
          />
        </label>
        <h3>Pago (simulado)</h3>
        <p className="form-grid__hint">No se realiza ningún cobro. Usa cualquier tarjeta de 16 dígitos; 4000 0000 0000 0002 simula un rechazo.</p>
        <label>Número de tarjeta
          <input
            inputMode="numeric"
            autoComplete="cc-number"
            required
            maxLength={19}
            placeholder="4242 4242 4242 4242"
            value={card.number}
            onChange={(event) => setCard({ ...card, number: event.target.value })}
          />
        </label>
        <div className="form-grid__row">
          <label>Vencimiento
            <input
              autoComplete="cc-exp"
              required
              maxLength={5}
              placeholder="MM/AA"
              value={card.expiry}
              onChange={(event) => setCard({ ...card, expiry: event.target.value })}
            />
          </label>
          <label>CVC
            <input
              inputMode="numeric"
              autoComplete="cc-csc"
              required
              maxLength={4}
              value={card.cvc}
              onChange={(event) => setCard({ ...card, cvc: event.target.value })}
            />
          </label>
        </div>
        <button className="button button--primary" type="submit" disabled={loading || !items.length || !user}>
          {loading ? <><Spinner size="sm" /> Procesando pago…</> : `Pagar ${formatPrice(totalPrice)}`}
        </button>
      </form>
      {error && <p role="alert" className="notice notice--error">{error}</p>}
    </div>
  );
}

export default CheckoutPage;