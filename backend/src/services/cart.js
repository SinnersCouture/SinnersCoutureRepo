const pool = require("../db/pool");

const getExecutor = (maybeExecutor) => maybeExecutor || pool;

const ensureCartId = async (userId, executor) => {
  const db = getExecutor(executor);

  const [rows] = await db.query(
    "SELECT carrito_id AS id FROM carrito WHERE usuario_id = ?",
    [userId]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await db.query(
    "INSERT INTO carrito (usuario_id) VALUES (?)",
    [userId]
  );

  return result.insertId;
};

const fetchCartItems = async (cartId, executor) => {
  const db = getExecutor(executor);

  const [rows] = await db.query(
    `SELECT
      ci.item_carrito_id AS id,
      ci.inventario_id AS inventarioId,
      ci.cantidad,
      inv.producto_id AS productoId,
      prod.nombre AS productoNombre,
      prod.precio AS productoPrecio,
      inv.cantidad_stock AS stockDisponible,
      tallas.talla_id AS tallaId,
      tallas.nombre AS tallaNombre
    FROM carrito_items ci
    INNER JOIN inventario inv ON inv.inventario_id = ci.inventario_id
    INNER JOIN productos prod ON prod.producto_id = inv.producto_id
    INNER JOIN tallas ON tallas.talla_id = inv.talla_id
    WHERE ci.carrito_id = ?
    ORDER BY ci.item_carrito_id DESC`,
    [cartId]
  );

  return rows;
};

const removeCartItem = async (cartId, itemId, executor) => {
  const db = getExecutor(executor);

  const [result] = await db.query(
    "DELETE FROM carrito_items WHERE carrito_id = ? AND item_carrito_id = ?",
    [cartId, itemId]
  );

  return result.affectedRows;
};

const clearCartItems = async (cartId, executor) => {
  const db = getExecutor(executor);
  await db.query("DELETE FROM carrito_items WHERE carrito_id = ?", [cartId]);
};

module.exports = {
  ensureCartId,
  fetchCartItems,
  removeCartItem,
  clearCartItems,
};

