import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import {
  fetchCollections,
  fetchInventoryByProduct,
  fetchProductsByCollection,
} from "../services/catalog.js";
import { updateCartItem } from "../services/cart.js";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-ES") : "Sin fecha";

const Collections = () => {
  const { token, user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [inventory, setInventory] = useState([]);

  const [loadingCollections, setLoadingCollections] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCollections = async () => {
      setLoadingCollections(true);
      setError(null);
      try {
        const data = await fetchCollections();
        if (!isMounted) {
          return;
        }
        setCollections(data);
        if (data.length > 0) {
          setSelectedCollectionId(data[0].id);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoadingCollections(false);
        }
      }
    };

    loadCollections();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCollectionId) {
      setProducts([]);
      setSelectedProductId(null);
      return;
    }

    let isMounted = true;

    const loadProducts = async () => {
      setLoadingProducts(true);
      setError(null);
      try {
        const data = await fetchProductsByCollection(selectedCollectionId);
        if (!isMounted) {
          return;
        }
        setProducts(data);
        setSelectedProductId(data.length > 0 ? data[0].id : null);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [selectedCollectionId]);

  useEffect(() => {
    if (!selectedProductId) {
      setInventory([]);
      return;
    }

    let isMounted = true;

    const loadInventory = async () => {
      setLoadingInventory(true);
      setError(null);
      try {
        const data = await fetchInventoryByProduct(selectedProductId);
        if (!isMounted) {
          return;
        }
        setInventory(data);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoadingInventory(false);
        }
      }
    };

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, [selectedProductId]);

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === selectedCollectionId) || null,
    [collections, selectedCollectionId]
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const handleQuantityInput = (inventarioId, value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) {
      return;
    }
    setQuantities((prev) => ({ ...prev, [inventarioId]: amount }));
  };

  const handleAddToCart = async (item) => {
    if (!token) {
      setError("Debes iniciar sesión para añadir items al carrito");
      return;
    }

    const cantidad = quantities[item.id] ?? 1;

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser un número entero positivo");
      return;
    }

    if (cantidad > item.cantidadStock) {
      setError("No hay stock suficiente para esa cantidad");
      return;
    }

    setAddingToCart((prev) => ({ ...prev, [item.id]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      await updateCartItem({
        token,
        inventarioId: item.id,
        cantidad,
      });
      setSuccessMessage(`Añadido al carrito: ${cantidad} x ${item.tallaNombre}`);
      setQuantities((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingToCart((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  return (
    <div className="page">
      <h1>Colecciones</h1>
      {error && <p className="form__error">{error}</p>}

      <section>
        <h2 className="section-title">Temporadas</h2>
        {loadingCollections ? (
          <p>Cargando colecciones...</p>
        ) : collections.length === 0 ? (
          <p>No hay colecciones registradas.</p>
        ) : (
          <div className="collections-grid">
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                className={`chip ${
                  collection.id === selectedCollectionId ? "chip--active" : ""
                }`}
                onClick={() => setSelectedCollectionId(collection.id)}
              >
                <span className="chip__name">{collection.nombre}</span>
                <span className="chip__meta">
                  {formatDate(collection.fechaLanzamiento)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">Prendas</h2>
        {loadingProducts ? (
          <p>Cargando productos...</p>
        ) : products.length === 0 ? (
          <p>Sin productos para esta colección.</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <article
                key={product.id}
                className={`product-card ${
                  product.id === selectedProductId ? "product-card--active" : ""
                }`}
                onClick={() => setSelectedProductId(product.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setSelectedProductId(product.id);
                  }
                }}
              >
                <h3>{product.nombre}</h3>
                <p className="product-card__price">{formatPrice(product.precio)}</p>
                {selectedCollection && (
                  <p className="product-card__collection">{selectedCollection.nombre}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedProduct && (
        <section>
          <h2 className="section-title">Disponibilidad</h2>
          {loadingInventory ? (
            <p>Consultando inventario...</p>
          ) : inventory.length === 0 ? (
            <p>Sin stock registrado para este producto.</p>
          ) : (
            <>
              {successMessage && <p className="form__success">{successMessage}</p>}
              <ul className="inventory-list">
                {inventory.map((item) => (
                  <li key={item.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span>{item.tallaNombre}</span>
                      <span>{item.cantidadStock} uds</span>
                      {user && item.cantidadStock > 0 && (
                        <>
                          <label className="form__field" style={{ margin: 0, minWidth: "120px" }}>
                            <span style={{ fontSize: "0.875rem" }}>Cantidad</span>
                            <input
                              type="number"
                              min={1}
                              max={item.cantidadStock}
                              value={quantities[item.id] ?? 1}
                              onChange={(event) => handleQuantityInput(item.id, event.target.value)}
                              style={{ width: "100%" }}
                            />
                          </label>
                          <button
                            type="button"
                            className="button"
                            onClick={() => handleAddToCart(item)}
                            disabled={addingToCart[item.id]}
                          >
                            {addingToCart[item.id] ? "Añadiendo..." : "Añadir al carrito"}
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {!user && (
                <p>
                  <Link to="/login">Inicia sesión</Link> para añadir items al carrito.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default Collections;

