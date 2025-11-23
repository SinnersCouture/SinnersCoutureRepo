const express = require("express");

const pool = require("../db/pool");
const asyncHandler = require("../utils/asyncHandler");
const { createHttpError } = require("../utils/errors");
const { authenticate } = require("../middleware/auth");
const {
  ensureCartId,
  fetchCartItems,
  removeCartItem,
} = require("../services/cart");

const router = express.Router();

router.use(authenticate);

const mapCartItem = (row) => ({
  id: row.id,
  inventarioId: row.inventarioId,
  cantidad: row.cantidad,
  stockDisponible: row.stockDisponible,
  producto: {
    id: row.productoId,
    nombre: row.productoNombre,
    precio: Number(row.productoPrecio),
  },
  talla: {
    id: row.tallaId,
    nombre: row.tallaNombre,
  },
});

const buildCartResponse = async (cartId) => {
  const items = await fetchCartItems(cartId);
  const mappedItems = items.map(mapCartItem);

  const total = mappedItems.reduce(
    (sum, item) => sum + item.producto.precio * item.cantidad,
    0
  );

  return {
    id: cartId,
    items: mappedItems,
    total: Number(total.toFixed(2)),
  };
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cartId = await ensureCartId(req.user.id);
    const cart = await buildCartResponse(cartId);
    res.json(cart);
  })
);

router.put(
  "/items",
  asyncHandler(async (req, res) => {
    const { inventarioId, cantidad } = req.body;

    if (typeof inventarioId === "undefined" || typeof cantidad === "undefined") {
      throw createHttpError(400, "inventarioId and cantidad are required");
    }

    if (!Number.isInteger(cantidad) || cantidad < 0) {
      throw createHttpError(400, "cantidad must be a non-negative integer");
    }

    const [inventoryRows] = await pool.query(
      `SELECT inventario_id AS id, cantidad_stock AS stockDisponible
       FROM inventario WHERE inventario_id = ?`,
      [inventarioId]
    );

    if (inventoryRows.length === 0) {
      throw createHttpError(404, "Inventory item not found");
    }

    if (cantidad > inventoryRows[0].stockDisponible) {
      throw createHttpError(400, "Requested quantity exceeds stock");
    }

    const cartId = await ensureCartId(req.user.id);

    if (cantidad === 0) {
      await pool.query(
        "DELETE FROM carrito_items WHERE carrito_id = ? AND inventario_id = ?",
        [cartId, inventarioId]
      );
      const cart = await buildCartResponse(cartId);
      res.json(cart);
      return;
    }

    const [existingRows] = await pool.query(
      `SELECT item_carrito_id AS id
       FROM carrito_items
       WHERE carrito_id = ? AND inventario_id = ?`,
      [cartId, inventarioId]
    );

    if (existingRows.length > 0) {
      await pool.query(
        "UPDATE carrito_items SET cantidad = ? WHERE item_carrito_id = ?",
        [cantidad, existingRows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO carrito_items (carrito_id, inventario_id, cantidad) VALUES (?, ?, ?)",
        [cartId, inventarioId, cantidad]
      );
    }

    const cart = await buildCartResponse(cartId);
    res.json(cart);
  })
);

router.delete(
  "/items/:itemId",
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const cartId = await ensureCartId(req.user.id);
    const removed = await removeCartItem(cartId, itemId);

    if (removed === 0) {
      throw createHttpError(404, "Cart item not found");
    }

    res.status(204).send();
  })
);

module.exports = router;

