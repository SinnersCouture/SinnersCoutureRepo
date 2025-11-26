const express = require("express");

const pool = require("../db/pool");
const asyncHandler = require("../utils/asyncHandler");
const { createHttpError } = require("../utils/errors");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

const mapPost = (row) => ({
  id: row.id,
  titulo: row.titulo,
  contenido: row.contenido,
  fechaCreacion: row.fechaCreacion,
  autor: {
    id: row.autorId,
    nombre: row.autorNombre,
    email: row.autorEmail,
  },
});

const mapComment = (row) => ({
  id: row.id,
  contenido: row.contenido,
  fechaCreacion: row.fechaCreacion,
  usuario: {
    id: row.usuarioId,
    nombre: row.usuarioNombre,
    email: row.usuarioEmail,
  },
});

router.get(
  "/posts",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT
        p.publicacion_id AS id,
        p.titulo,
        p.contenido,
        p.fecha_creacion AS fechaCreacion,
        u.usuario_id AS autorId,
        u.nombre AS autorNombre,
        u.email AS autorEmail
      FROM publicaciones p
      INNER JOIN usuarios u ON u.usuario_id = p.autor_id
      ORDER BY p.fecha_creacion DESC`
    );

    res.json(rows.map(mapPost));
  })
);

router.get(
  "/posts/:postId",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const [postRows] = await pool.query(
      `SELECT
        p.publicacion_id AS id,
        p.titulo,
        p.contenido,
        p.fecha_creacion AS fechaCreacion,
        u.usuario_id AS autorId,
        u.nombre AS autorNombre,
        u.email AS autorEmail
      FROM publicaciones p
      INNER JOIN usuarios u ON u.usuario_id = p.autor_id
      WHERE p.publicacion_id = ?`,
      [postId]
    );

    if (postRows.length === 0) {
      throw createHttpError(404, "Post not found");
    }

    const post = mapPost(postRows[0]);

    const [commentRows] = await pool.query(
      `SELECT
        c.comentario_id AS id,
        c.contenido,
        c.fecha_creacion AS fechaCreacion,
        u.usuario_id AS usuarioId,
        u.nombre AS usuarioNombre,
        u.email AS usuarioEmail
      FROM comentarios c
      INNER JOIN usuarios u ON u.usuario_id = c.usuario_id
      WHERE c.publicacion_id = ?
      ORDER BY c.fecha_creacion ASC`,
      [postId]
    );

    post.comments = commentRows.map(mapComment);

    res.json(post);
  })
);

router.post(
  "/posts",
  authenticate,
  asyncHandler(async (req, res) => {
    const { titulo, contenido } = req.body;

    if (!titulo || !contenido) {
      throw createHttpError(400, "titulo and contenido are required");
    }

    const [result] = await pool.query(
      "INSERT INTO publicaciones (autor_id, titulo, contenido) VALUES (?, ?, ?)",
      [req.user.id, titulo, contenido]
    );

    const [rows] = await pool.query(
      `SELECT
        p.publicacion_id AS id,
        p.titulo,
        p.contenido,
        p.fecha_creacion AS fechaCreacion,
        u.usuario_id AS autorId,
        u.nombre AS autorNombre,
        u.email AS autorEmail
      FROM publicaciones p
      INNER JOIN usuarios u ON u.usuario_id = p.autor_id
      WHERE p.publicacion_id = ?`,
      [result.insertId]
    );

    res.status(201).json(mapPost(rows[0]));
  })
);

router.patch(
  "/posts/:postId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { titulo, contenido } = req.body;

    const [existingRows] = await pool.query(
      "SELECT autor_id FROM publicaciones WHERE publicacion_id = ?",
      [postId]
    );

    if (existingRows.length === 0) {
      throw createHttpError(404, "Post not found");
    }

    const post = existingRows[0];

    if (post.autor_id !== req.user.id && !req.user.isAdmin) {
      throw createHttpError(403, "You can only edit your own posts");
    }

    const updates = [];
    const values = [];

    if (typeof titulo !== "undefined") {
      updates.push("titulo = ?");
      values.push(titulo);
    }
    if (typeof contenido !== "undefined") {
      updates.push("contenido = ?");
      values.push(contenido);
    }

    if (updates.length === 0) {
      throw createHttpError(400, "No fields to update");
    }

    values.push(postId);

    await pool.query(
      `UPDATE publicaciones SET ${updates.join(", ")} WHERE publicacion_id = ?`,
      values
    );

    const [rows] = await pool.query(
      `SELECT
        p.publicacion_id AS id,
        p.titulo,
        p.contenido,
        p.fecha_creacion AS fechaCreacion,
        u.usuario_id AS autorId,
        u.nombre AS autorNombre,
        u.email AS autorEmail
      FROM publicaciones p
      INNER JOIN usuarios u ON u.usuario_id = p.autor_id
      WHERE p.publicacion_id = ?`,
      [postId]
    );

    res.json(mapPost(rows[0]));
  })
);

router.delete(
  "/posts/:postId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const [existingRows] = await pool.query(
      "SELECT autor_id FROM publicaciones WHERE publicacion_id = ?",
      [postId]
    );

    if (existingRows.length === 0) {
      throw createHttpError(404, "Post not found");
    }

    const post = existingRows[0];

    if (post.autor_id !== req.user.id && !req.user.isAdmin) {
      throw createHttpError(403, "You can only delete your own posts");
    }

    await pool.query("DELETE FROM publicaciones WHERE publicacion_id = ?", [postId]);

    res.status(204).send();
  })
);

router.post(
  "/posts/:postId/comments",
  authenticate,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { contenido } = req.body;

    if (!contenido) {
      throw createHttpError(400, "contenido is required");
    }

    const [postRows] = await pool.query(
      "SELECT publicacion_id FROM publicaciones WHERE publicacion_id = ?",
      [postId]
    );

    if (postRows.length === 0) {
      throw createHttpError(404, "Post not found");
    }

    const [result] = await pool.query(
      "INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)",
      [postId, req.user.id, contenido]
    );

    const [rows] = await pool.query(
      `SELECT
        c.comentario_id AS id,
        c.contenido,
        c.fecha_creacion AS fechaCreacion,
        u.usuario_id AS usuarioId,
        u.nombre AS usuarioNombre,
        u.email AS usuarioEmail
      FROM comentarios c
      INNER JOIN usuarios u ON u.usuario_id = c.usuario_id
      WHERE c.comentario_id = ?`,
      [result.insertId]
    );

    res.status(201).json(mapComment(rows[0]));
  })
);

router.delete(
  "/comments/:commentId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const [existingRows] = await pool.query(
      "SELECT usuario_id FROM comentarios WHERE comentario_id = ?",
      [commentId]
    );

    if (existingRows.length === 0) {
      throw createHttpError(404, "Comment not found");
    }

    const comment = existingRows[0];

    if (comment.usuario_id !== req.user.id && !req.user.isAdmin) {
      throw createHttpError(403, "You can only delete your own comments");
    }

    await pool.query("DELETE FROM comentarios WHERE comentario_id = ?", [commentId]);

    res.status(204).send();
  })
);

module.exports = router;

