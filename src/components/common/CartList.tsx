import type React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/cart/useCart";
import ConfirmActionButton from "./ConfirmActionButton";

export const CartList: React.FC = () => {
  const { items, totalItems, totalPrice, addToCart, decreaseQuantity, removeFromCart, clearCart } = useCart();

  if (items.length === 0) {
    return <p className="state-container">Tu carrito está vacío 🛒</p>;
  }

  return (
    <div className="page">
      <h2>Carrito de compras</h2>
      <div className="layout-split">
        <section className="panel">
          <ul className="cart-items">
            {items.map((item) => (
              <li key={item.product.id} className="cart-item">
                <div className="cart-item__product">
                  {item.product.imageUrl ? (
                    <img className="cart-item__thumbnail" src={item.product.imageUrl} alt={item.product.name} />
                  ) : (
                    <span className="cart-item__thumbnail cart-item__thumbnail--empty" role="img" aria-label={`Imagen no disponible para ${item.product.name}`} />
                  )}
                  <div className="cart-item__info">
                    <strong>{item.product.name}</strong>
                    <span className="cart-item__price">${item.product.price}</span>
                    <span className="cart-item__qty">Cantidad: {item.quantity}</span>
                  </div>
                </div>
                <div className="cart-item__actions">
                  <button className="button button--quiet button--compact" aria-label="Sumar uno" onClick={() => addToCart(item.product, 1)}>
                    ➕
                  </button>
                  <button className="button button--quiet button--compact" aria-label="Restar uno" onClick={() => decreaseQuantity(item.product.id)}>
                    ➖
                  </button>
                  <ConfirmActionButton
                    className="button button--danger button--compact"
                    title={`¿Quitar ${item.product.name} del carrito?`}
                    description="Se eliminará este producto y su cantidad del carrito."
                    confirmLabel="Quitar producto"
                    onConfirm={() => removeFromCart(item.product.id)}
                  >
                    Eliminar
                  </ConfirmActionButton>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="panel cart-summary">
          <h3>Resumen</h3>
          <p>Total de ítems: <span>{totalItems}</span></p>
          <p className="cart-summary__total">Total a pagar: <span>${totalPrice}</span></p>
          <div className="cart-summary__actions">
            <Link className="button button--primary" to="/checkout">Continuar al checkout</Link>
            <ConfirmActionButton
              className="button button--quiet"
              title="¿Vaciar todo el carrito?"
              description={`Se quitarán ${totalItems} artículos del carrito. Esta acción no se puede deshacer.`}
              confirmLabel="Sí, vaciar carrito"
              onConfirm={clearCart}
            >
              Vaciar carrito
            </ConfirmActionButton>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartList;