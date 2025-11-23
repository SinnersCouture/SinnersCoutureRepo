import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { fetchOrderById, fetchOrders } from "../services/orders.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value));

const Orders = () => {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) {
        setOrders([]);
        return;
      }

      setLoadingOrders(true);
      setError(null);

      try {
        const data = await fetchOrders(token);
        setOrders(data);

        if (data.length > 0) {
          const firstOrder = await fetchOrderById({ token, orderId: data[0].id });
          setSelectedOrder(firstOrder);
        } else {
          setSelectedOrder(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [token]);

  const handleSelectOrder = async (orderId) => {
    if (!token) {
      return;
    }

    setLoadingDetail(true);
    setError(null);

    try {
      const order = await fetchOrderById({ token, orderId });
      setSelectedOrder(order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!token) {
    return (
      <div className="page">
        <h1>Pedidos</h1>
        <p>
          Inicia sesión para consultar tus pedidos. <Link to="/login">Acceder</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Pedidos</h1>
      {error && <p className="form__error">{error}</p>}

      {loadingOrders ? (
        <p>Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <p>No tienes pedidos registrados.</p>
      ) : (
        <div className="orders-layout">
          <aside className="orders-list">
            <h2 className="section-title">Historial</h2>
            <ul>
              {orders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    className={`orders-list__item ${
                      selectedOrder && order.id === selectedOrder.id ? "orders-list__item--active" : ""
                    }`}
                    onClick={() => handleSelectOrder(order.id)}
                  >
                    <span>#{order.id}</span>
                    <span>{formatCurrency(order.importeTotal)}</span>
                    <span className={`order-status order-status--${order.estado}`}>
                      {order.estado}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="orders-detail">
            {loadingDetail ? (
              <p>Cargando detalle...</p>
            ) : selectedOrder ? (
              <div className="order-card">
                <header>
                  <h2>Pedido #{selectedOrder.id}</h2>
                  <p>Estado: {selectedOrder.estado}</p>
                  <p>Fecha: {new Date(selectedOrder.fechaPedido).toLocaleString("es-ES")}</p>
                  <p>Total: {formatCurrency(selectedOrder.importeTotal)}</p>
                </header>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Talla</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.producto.nombre}</td>
                        <td>{item.talla.nombre}</td>
                        <td>{item.cantidad}</td>
                        <td>{formatCurrency(item.precioCompra)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Selecciona un pedido para ver el detalle.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Orders;

