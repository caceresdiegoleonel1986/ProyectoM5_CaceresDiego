import type React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/cart/useCart";
import ConfirmActionButton from "./ConfirmActionButton";

export const CartList: React.FC = () => {
  const { items, totalItems, totalPrice, addToCart, decreaseQuantity, removeFromCart, clearCart } = useCart();

  if (items.length === 0) {
    return <p>Tu carrito está vacío 🛒</p>;
  }

  return (
    <div>
      <h2>Carrito de compras</h2>
      <ul>
        {items.map((item) => (
          <li key={item.product.id} style={{ marginBottom: "1rem" }}>
            <strong>{item.product.name}</strong> - ${item.product.price}  
            <br />
            Cantidad: {item.quantity}
            <div style={{ marginTop: "0.5rem" }}>
              <button onClick={() => addToCart(item.product, 1)}>
                ➕
              </button>
              <button onClick={() => decreaseQuantity(item.product.id)}>
                ➖
              </button>
              <ConfirmActionButton
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

      <hr />
      <p>Total de ítems: {totalItems}</p>
      <p>Total a pagar: ${totalPrice}</p>

      <ConfirmActionButton
        title="¿Vaciar todo el carrito?"
        description={`Se quitarán ${totalItems} artículos del carrito. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, vaciar carrito"
        onConfirm={clearCart}
      >
        Vaciar carrito
      </ConfirmActionButton>
      <Link className="ml-3" to="/checkout">Continuar al checkout</Link>
    </div>
  );
};

export default CartList;