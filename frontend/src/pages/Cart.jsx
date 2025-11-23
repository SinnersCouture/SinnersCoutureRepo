import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import {
  deleteCartItem,
  fetchCart,
  updateCartItem,
} from "../services/cart.js";
import { createOrder } from "../services/orders.js";

const Cart = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [cart, setCart] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const isCartEmpty = !cart || cart.items.length === 0;

  const loadCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCart(token);
      setCart(data);
      const map = {};
      data.items.forEach((item) => {
        map[item.id] = item.cantidad;
      });
      setQuantities(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleQuantityInput = (itemId, value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) {
      return;
    }
    setQuantities((prev) => ({ ...prev, [itemId]: amount }));
  };

  const handleUpdateItem = async (item) => {
    if (!token) {
      return;
    }

    const nextQuantity = quantities[item.id];
    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      setError("Cantidad inválida");
      return;
    }

    if (nextQuantity > item.stockDisponible) {
      setError("No hay stock suficiente para esa cantidad");
      return;
    }

    setUpdatingItemId(item.id);
    setError(null);

    try {
      const updatedCart = await updateCartItem({
        token,
        inventarioId: item.inventarioId,
        cantidad: nextQuantity,
      });
      setCart(updatedCart);
      const map = {};
      updatedCart.items.forEach((nextItem) => {
        map[nextItem.id] = nextItem.cantidad;
      });
      setQuantities(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (item) => {
    if (!token) {
      return;
    }

    setUpdatingItemId(item.id);
    setError(null);

    try {
      await deleteCartItem({ token, itemId: item.id });
      await loadCart();
    } catch (err) {
      setError(err.message);
      setUpdatingItemId(null);
    }
  };

  const handleCreateOrder = async () => {
    if (!token) {
      return;
    }

    setIsCreatingOrder(true);
    setError(null);
    setStatus(null);

    try {
      const order = await createOrder(token);
      setStatus(`Pedido ${order.id} creado correctamente.`);
      await loadCart();
      navigate("/orders", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const totalFormatted = useMemo(
    () => (cart ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cart.total) : ""),
    [cart]
  );

  if (!token) {
    return (
      <div className="page">
        <h1>Carrito</h1>
        <p>
          Inicia sesión para gestionar tu carrito. <Link to="/login">Acceder</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Carrito</h1>
      {error && <p className="form__error">{error}</p>}
      {status && <p className="form__success">{status}</p>}

      {isLoading ? (
        <p>Cargando carrito...</p>
      ) : isCartEmpty ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div className="cart-list">
          {cart.items.map((item) => (
            <article key={item.id} className="cart-item">
              <div className="cart-item__info">
                <h3>{item.producto.nombre}</h3>
                <p>Talla: {item.talla.nombre}</p>
                <p>Precio: {Number(item.producto.precio).toFixed(2)} €</p>
                <p>Stock disponible: {item.stockDisponible}</p>
              </div>
              <div className="cart-item__actions">
                <label className="form__field">
                  <span>Cantidad</span>
                  <input
                    type="number"
                    min={0}
                    max={item.stockDisponible}
                    value={quantities[item.id] ?? item.cantidad}
                    onChange={(event) => handleQuantityInput(item.id, event.target.value)}
                  />
                </label>
                <div className="cart-item__buttons">
                  <button
                    type="button"
                    className="button"
                    onClick={() => handleUpdateItem(item)}
                    disabled={updatingItemId === item.id}
                  >
                    {updatingItemId === item.id ? "Actualizando..." : "Actualizar"}
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleRemoveItem(item)}
                    disabled={updatingItemId === item.id}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isCartEmpty && (
        <footer className="cart-summary">
          <p>Total: {totalFormatted}</p>
          <button
            type="button"
            className="button"
            onClick={handleCreateOrder}
            disabled={isCreatingOrder || isLoading}
          >
            {isCreatingOrder ? "Creando pedido..." : "Finalizar pedido"}
          </button>
        </footer>
      )}
    </div>
  );
};

export default Cart;

