const express = require("express");

const pool = require("../db/pool");
const asyncHandler = require("../utils/asyncHandler");
const { createHttpError } = require("../utils/errors");
const { authenticate } = require("../middleware/auth");
const { ensureCartId, clearCartItems } = require("../services/cart");

const router = express.Router();

router.use(authenticate);

const mapOrderSummary = (row) => ({
  id: row.id,
  importeTotal: Number(row.importeTotal),
  estado: row.estado,
  fechaPedido: row.fechaPedido,
});

const mapOrderItem = (row) => ({
  id: row.id,
  inventarioId: row.inventarioId,
  cantidad: row.cantidad,
  precioCompra: Number(row.precioCompra),
  producto: {
    id: row.productoId,
    nombre: row.productoNombre,
  },
  talla: {
    id: row.tallaId,
    nombre: row.tallaNombre,
  },
});

const fetchOrderWithItems = async (orderId, userId) => {
  const [orders] = await pool.query(
    `SELECT
        pedido_id AS id,
        importe_total AS importeTotal,
        estado,
        fecha_pedido AS fechaPedido
      FROM pedidos
      WHERE pedido_id = ? AND usuario_id = ?`,
    [orderId, userId]
  );

  if (orders.length === 0) {
    throw createHttpError(404, "Order not found");
  }

  const order = mapOrderSummary(orders[0]);

  const [items] = await pool.query(
    `SELECT
        item_pedido_id AS id,
        inventario_id AS inventarioId,
        cantidad,
        precio_compra AS precioCompra,
        productos.producto_id AS productoId,
        productos.nombre AS productoNombre,
        tallas.talla_id AS tallaId,
        tallas.nombre AS tallaNombre
      FROM pedido_items
      INNER JOIN inventario ON inventario.inventario_id = pedido_items.inventario_id
      INNER JOIN productos ON productos.producto_id = inventario.producto_id
      INNER JOIN tallas ON tallas.talla_id = inventario.talla_id
      WHERE pedido_id = ?
      ORDER BY item_pedido_id ASC`,
    [orderId]
  );

  return {
    ...order,
    items: items.map(mapOrderItem),
  };
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT
        pedido_id AS id,
        importe_total AS importeTotal,
        estado,
        fecha_pedido AS fechaPedido
      FROM pedidos
      WHERE usuario_id = ?
      ORDER BY fecha_pedido DESC, pedido_id DESC`,
      [req.user.id]
    );

    res.json(rows.map(mapOrderSummary));
  })
);

router.get(
  "/:orderId",
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await fetchOrderWithItems(orderId, req.user.id);
    res.json(order);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const cartId = await ensureCartId(req.user.id, connection);

      const [cartRows] = await connection.query(
        `SELECT
            ci.item_carrito_id AS cartItemId,
            ci.inventario_id AS inventarioId,
            ci.cantidad,
            inv.cantidad_stock AS stockDisponible,
            inv.producto_id AS productoId,
            prod.precio AS productoPrecio
          FROM carrito_items ci
          INNER JOIN inventario inv ON inv.inventario_id = ci.inventario_id
          INNER JOIN productos prod ON prod.producto_id = inv.producto_id
          WHERE ci.carrito_id = ?
          FOR UPDATE`,
        [cartId]
      );

      if (cartRows.length === 0) {
        throw createHttpError(400, "Cart is empty");
      }

      for (const item of cartRows) {
        if (item.cantidad > item.stockDisponible) {
          throw createHttpError(400, "Insufficient stock for one or more items");
        }
      }

      const total = cartRows.reduce(
        (sum, item) => sum + Number(item.productoPrecio) * item.cantidad,
        0
      );
      const totalRounded = Number(total.toFixed(2));

      const [orderResult] = await connection.query(
        `INSERT INTO pedidos (usuario_id, importe_total, estado)
         VALUES (?, ?, 'pendiente')`,
        [req.user.id, totalRounded]
      );

      const orderId = orderResult.insertId;

      for (const item of cartRows) {
        await connection.query(
          `INSERT INTO pedido_items (pedido_id, inventario_id, cantidad, precio_compra)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.inventarioId, item.cantidad, item.productoPrecio]
        );

        await connection.query(
          `UPDATE inventario
           SET cantidad_stock = cantidad_stock - ?
           WHERE inventario_id = ?`,
          [item.cantidad, item.inventarioId]
        );
      }

      await clearCartItems(cartId, connection);

      await connection.commit();

      const order = await fetchOrderWithItems(orderId, req.user.id);
      res.status(201).json(order);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

module.exports = router;

