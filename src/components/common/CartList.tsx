import type React from "react";
import { useCart } from "../../contexts/cart/useCart";

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
              <button onClick={() => removeFromCart(item.product.id)}>
                ❌ Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <hr />
      <p>Total de ítems: {totalItems}</p>
      <p>Total a pagar: ${totalPrice}</p>

      <button onClick={clearCart}>
        Vaciar carrito
      </button>
    </div>
  );
};

export default CartList;