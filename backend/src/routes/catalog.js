const express = require("express");

const pool = require("../db/pool");
const asyncHandler = require("../utils/asyncHandler");
const { createHttpError } = require("../utils/errors");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

const mapCollection = (row) => ({
  id: row.id,
  nombre: row.nombre,
  fechaLanzamiento: row.fechaLanzamiento,
  hashContrasenaAcceso: row.hashContrasenaAcceso,
  estaActiva: Boolean(row.estaActiva),
});

const mapProduct = (row) => ({
  id: row.id,
  coleccionId: row.coleccionId,
  nombre: row.nombre,
  precio: row.precio,
});

const mapSize = (row) => ({
  id: row.id,
  nombre: row.nombre,
});

const mapInventory = (row) => ({
  id: row.id,
  productoId: row.productoId,
  tallaId: row.tallaId,
  tallaNombre: row.tallaNombre,
  cantidadStock: row.cantidadStock,
});

router.get(
  "/collections",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT
        coleccion_id AS id,
        nombre,
        fecha_lanzamiento AS fechaLanzamiento,
        hash_contrasena_acceso AS hashContrasenaAcceso,
        esta_activa AS estaActiva
      FROM colecciones
      ORDER BY fecha_lanzamiento DESC, id DESC`
    );

    res.json(rows.map(mapCollection));
  })
);

router.post(
  "/collections",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { nombre, fechaLanzamiento, hashContrasenaAcceso, estaActiva } = req.body;

    if (!nombre) {
      throw createHttpError(400, "nombre is required");
    }

    const columns = ["nombre"];
    const values = [nombre];

    if (typeof fechaLanzamiento !== "undefined") {
      columns.push("fecha_lanzamiento");
      values.push(fechaLanzamiento);
    }
    if (typeof hashContrasenaAcceso !== "undefined") {
      columns.push("hash_contrasena_acceso");
      values.push(hashContrasenaAcceso);
    }
    if (typeof estaActiva !== "undefined") {
      columns.push("esta_activa");
      values.push(estaActiva ? 1 : 0);
    }

    const placeholders = columns.map(() => "?").join(", ");

    const [result] = await pool.query(
      `INSERT INTO colecciones (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );

    const [rows] = await pool.query(
      `SELECT
        coleccion_id AS id,
        nombre,
        fecha_lanzamiento AS fechaLanzamiento,
        hash_contrasena_acceso AS hashContrasenaAcceso,
        esta_activa AS estaActiva
      FROM colecciones
      WHERE coleccion_id = ?`,
      [result.insertId]
    );

    res.status(201).json(mapCollection(rows[0]));
  })
);

router.patch(
  "/collections/:collectionId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { nombre, fechaLanzamiento, hashContrasenaAcceso, estaActiva } = req.body;

    const updates = [];
    const values = [];

    if (typeof nombre !== "undefined") {
      updates.push("nombre = ?");
      values.push(nombre);
    }
    if (typeof fechaLanzamiento !== "undefined") {
      updates.push("fecha_lanzamiento = ?");
      values.push(fechaLanzamiento);
    }
    if (typeof hashContrasenaAcceso !== "undefined") {
      updates.push("hash_contrasena_acceso = ?");
      values.push(hashContrasenaAcceso);
    }
    if (typeof estaActiva !== "undefined") {
      updates.push("esta_activa = ?");
      values.push(estaActiva ? 1 : 0);
    }

    if (updates.length === 0) {
      throw createHttpError(400, "No fields to update");
    }

    values.push(collectionId);

    const [result] = await pool.query(
      `UPDATE colecciones SET ${updates.join(", ")} WHERE coleccion_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Collection not found");
    }

    const [rows] = await pool.query(
      `SELECT
        coleccion_id AS id,
        nombre,
        fecha_lanzamiento AS fechaLanzamiento,
        hash_contrasena_acceso AS hashContrasenaAcceso,
        esta_activa AS estaActiva
      FROM colecciones
      WHERE coleccion_id = ?`,
      [collectionId]
    );

    res.json(mapCollection(rows[0]));
  })
);

router.delete(
  "/collections/:collectionId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    const [result] = await pool.query(
      "DELETE FROM colecciones WHERE coleccion_id = ?",
      [collectionId]
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Collection not found");
    }

    res.status(204).send();
  })
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const { collectionId } = req.query;

    let sql =
      "SELECT producto_id AS id, coleccion_id AS coleccionId, nombre, precio FROM productos";
    const values = [];

    if (collectionId) {
      sql += " WHERE coleccion_id = ?";
      values.push(collectionId);
    }

    sql += " ORDER BY nombre ASC";

    const [rows] = await pool.query(sql, values);

    res.json(rows.map(mapProduct));
  })
);

router.get(
  "/collections/:collectionId/products",
  asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    const [rows] = await pool.query(
      `SELECT producto_id AS id, coleccion_id AS coleccionId, nombre, precio
       FROM productos
       WHERE coleccion_id = ?
       ORDER BY nombre ASC`,
      [collectionId]
    );

    res.json(rows.map(mapProduct));
  })
);

router.post(
  "/products",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { coleccionId, nombre, precio } = req.body;

    if (!coleccionId || !nombre || typeof precio === "undefined") {
      throw createHttpError(400, "coleccionId, nombre, and precio are required");
    }

    const [result] = await pool.query(
      "INSERT INTO productos (coleccion_id, nombre, precio) VALUES (?, ?, ?)",
      [coleccionId, nombre, precio]
    );

    const [rows] = await pool.query(
      `SELECT producto_id AS id, coleccion_id AS coleccionId, nombre, precio
       FROM productos WHERE producto_id = ?`,
      [result.insertId]
    );

    res.status(201).json(mapProduct(rows[0]));
  })
);

router.patch(
  "/products/:productId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { coleccionId, nombre, precio } = req.body;

    const updates = [];
    const values = [];

    if (typeof coleccionId !== "undefined") {
      updates.push("coleccion_id = ?");
      values.push(coleccionId);
    }
    if (typeof nombre !== "undefined") {
      updates.push("nombre = ?");
      values.push(nombre);
    }
    if (typeof precio !== "undefined") {
      updates.push("precio = ?");
      values.push(precio);
    }

    if (updates.length === 0) {
      throw createHttpError(400, "No fields to update");
    }

    values.push(productId);

    const [result] = await pool.query(
      `UPDATE productos SET ${updates.join(", ")} WHERE producto_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Product not found");
    }

    const [rows] = await pool.query(
      `SELECT producto_id AS id, coleccion_id AS coleccionId, nombre, precio
       FROM productos WHERE producto_id = ?`,
      [productId]
    );

    res.json(mapProduct(rows[0]));
  })
);

router.delete(
  "/products/:productId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const [result] = await pool.query(
      "DELETE FROM productos WHERE producto_id = ?",
      [productId]
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Product not found");
    }

    res.status(204).send();
  })
);

router.get(
  "/sizes",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query(
      "SELECT talla_id AS id, nombre FROM tallas ORDER BY nombre ASC"
    );

    res.json(rows.map(mapSize));
  })
);

router.post(
  "/sizes",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
      throw createHttpError(400, "nombre is required");
    }

    const [result] = await pool.query(
      "INSERT INTO tallas (nombre) VALUES (?)",
      [nombre]
    );

    const [rows] = await pool.query(
      "SELECT talla_id AS id, nombre FROM tallas WHERE talla_id = ?",
      [result.insertId]
    );

    res.status(201).json(mapSize(rows[0]));
  })
);

router.delete(
  "/sizes/:sizeId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { sizeId } = req.params;

    const [result] = await pool.query(
      "DELETE FROM tallas WHERE talla_id = ?",
      [sizeId]
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Size not found");
    }

    res.status(204).send();
  })
);

router.get(
  "/products/:productId/inventory",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const [rows] = await pool.query(
      `SELECT
        inventario_id AS id,
        producto_id AS productoId,
        inventario.talla_id AS tallaId,
        tallas.nombre AS tallaNombre,
        cantidad_stock AS cantidadStock
      FROM inventario
      INNER JOIN tallas ON tallas.talla_id = inventario.talla_id
      WHERE producto_id = ?
      ORDER BY tallas.nombre ASC`,
      [productId]
    );

    res.json(rows.map(mapInventory));
  })
);

router.put(
  "/inventory",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { productoId, tallaId, cantidadStock } = req.body;

    if (
      typeof productoId === "undefined" ||
      typeof tallaId === "undefined" ||
      typeof cantidadStock === "undefined"
    ) {
      throw createHttpError(
        400,
        "productoId, tallaId, and cantidadStock are required"
      );
    }

    if (Number(cantidadStock) < 0) {
      throw createHttpError(400, "cantidadStock must be zero or greater");
    }

    await pool.query(
      `INSERT INTO inventario (producto_id, talla_id, cantidad_stock)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad_stock = VALUES(cantidad_stock)`,
      [productoId, tallaId, cantidadStock]
    );

    const [rows] = await pool.query(
      `SELECT
        inventario_id AS id,
        producto_id AS productoId,
        inventario.talla_id AS tallaId,
        tallas.nombre AS tallaNombre,
        cantidad_stock AS cantidadStock
      FROM inventario
      INNER JOIN tallas ON tallas.talla_id = inventario.talla_id
      WHERE producto_id = ? AND inventario.talla_id = ?`,
      [productoId, tallaId]
    );

    res.json(mapInventory(rows[0]));
  })
);

module.exports = router;

