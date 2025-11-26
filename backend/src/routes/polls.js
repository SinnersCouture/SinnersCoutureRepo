const express = require("express");

const pool = require("../db/pool");
const asyncHandler = require("../utils/asyncHandler");
const { createHttpError } = require("../utils/errors");
const { authenticate, optionalAuthenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

const mapPoll = (row) => ({
  id: row.id,
  pregunta: row.pregunta,
  fechaFin: row.fechaFin,
  estaActiva: Boolean(row.estaActiva),
  creadaPor: {
    id: row.creadaPorId,
    nombre: row.creadaPorNombre,
  },
});

const mapPollOption = (row) => ({
  id: row.id,
  textoOpcion: row.textoOpcion,
  voteCount: row.voteCount || 0,
});

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [rows] = await pool.query(
      `SELECT
        e.encuesta_id AS id,
        e.pregunta,
        e.fecha_fin AS fechaFin,
        e.esta_activa AS estaActiva,
        u.usuario_id AS creadaPorId,
        u.nombre AS creadaPorNombre
      FROM encuestas e
      INNER JOIN usuarios u ON u.usuario_id = e.creada_por_id
      WHERE e.esta_activa = 1 AND e.fecha_fin > ?
      ORDER BY e.fecha_fin ASC`,
      [now]
    );

    const polls = await Promise.all(
      rows.map(async (poll) => {
        const [optionRows] = await pool.query(
          `SELECT
            o.opcion_id AS id,
            o.texto_opcion AS textoOpcion,
            COUNT(v.voto_id) AS voteCount
          FROM opciones_encuesta o
          LEFT JOIN votos v ON v.opcion_id = o.opcion_id
          WHERE o.encuesta_id = ?
          GROUP BY o.opcion_id, o.texto_opcion
          ORDER BY o.opcion_id ASC`,
          [poll.id]
        );

        return {
          ...mapPoll(poll),
          options: optionRows.map(mapPollOption),
        };
      })
    );

    res.json(polls);
  })
);

router.get(
  "/:pollId",
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const userId = req.user ? req.user.id : null;

    const [pollRows] = await pool.query(
      `SELECT
        e.encuesta_id AS id,
        e.pregunta,
        e.fecha_fin AS fechaFin,
        e.esta_activa AS estaActiva,
        u.usuario_id AS creadaPorId,
        u.nombre AS creadaPorNombre
      FROM encuestas e
      INNER JOIN usuarios u ON u.usuario_id = e.creada_por_id
      WHERE e.encuesta_id = ?`,
      [pollId]
    );

    if (pollRows.length === 0) {
      throw createHttpError(404, "Poll not found");
    }

    const poll = mapPoll(pollRows[0]);

    const [optionRows] = await pool.query(
      `SELECT
        o.opcion_id AS id,
        o.texto_opcion AS textoOpcion,
        COUNT(v.voto_id) AS voteCount
      FROM opciones_encuesta o
      LEFT JOIN votos v ON v.opcion_id = o.opcion_id
      WHERE o.encuesta_id = ?
      GROUP BY o.opcion_id, o.texto_opcion
      ORDER BY o.opcion_id ASC`,
      [pollId]
    );

    poll.options = optionRows.map(mapPollOption);

    if (userId) {
      const [voteRows] = await pool.query(
        "SELECT opcion_id FROM votos WHERE usuario_id = ? AND encuesta_id = ?",
        [userId, pollId]
      );

      poll.userVote = voteRows.length > 0 ? voteRows[0].opcion_id : null;
    } else {
      poll.userVote = null;
    }

    res.json(poll);
  })
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pregunta, fechaFin, opciones } = req.body;

    if (!pregunta || !fechaFin || !Array.isArray(opciones) || opciones.length < 2) {
      throw createHttpError(
        400,
        "pregunta, fechaFin, and at least 2 opciones are required"
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "INSERT INTO encuestas (pregunta, creada_por_id, fecha_fin) VALUES (?, ?, ?)",
        [pregunta, req.user.id, fechaFin]
      );

      const pollId = result.insertId;

      for (const textoOpcion of opciones) {
        if (!textoOpcion || typeof textoOpcion !== "string" || textoOpcion.trim() === "") {
          throw createHttpError(400, "All opciones must be non-empty strings");
        }

        await connection.query(
          "INSERT INTO opciones_encuesta (encuesta_id, texto_opcion) VALUES (?, ?)",
          [pollId, textoOpcion.trim()]
        );
      }

      await connection.commit();

      const [pollRows] = await pool.query(
        `SELECT
          e.encuesta_id AS id,
          e.pregunta,
          e.fecha_fin AS fechaFin,
          e.esta_activa AS estaActiva,
          u.usuario_id AS creadaPorId,
          u.nombre AS creadaPorNombre
        FROM encuestas e
        INNER JOIN usuarios u ON u.usuario_id = e.creada_por_id
        WHERE e.encuesta_id = ?`,
        [pollId]
      );

      const poll = mapPoll(pollRows[0]);

      const [optionRows] = await pool.query(
        `SELECT
          o.opcion_id AS id,
          o.texto_opcion AS textoOpcion,
          0 AS voteCount
        FROM opciones_encuesta o
        WHERE o.encuesta_id = ?
        ORDER BY o.opcion_id ASC`,
        [pollId]
      );

      poll.options = optionRows.map(mapPollOption);

      res.status(201).json(poll);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

router.post(
  "/:pollId/vote",
  authenticate,
  asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const { opcionId } = req.body;

    if (!opcionId) {
      throw createHttpError(400, "opcionId is required");
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [pollRows] = await connection.query(
        `SELECT encuesta_id, esta_activa, fecha_fin
         FROM encuestas
         WHERE encuesta_id = ?
         FOR UPDATE`,
        [pollId]
      );

      if (pollRows.length === 0) {
        throw createHttpError(404, "Poll not found");
      }

      const poll = pollRows[0];
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      if (!poll.esta_activa || poll.fecha_fin <= now) {
        throw createHttpError(400, "Poll is not active");
      }

      const [optionRows] = await connection.query(
        "SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id = ? AND opcion_id = ?",
        [pollId, opcionId]
      );

      if (optionRows.length === 0) {
        throw createHttpError(404, "Option not found for this poll");
      }

      const [existingVoteRows] = await connection.query(
        "SELECT voto_id FROM votos WHERE usuario_id = ? AND encuesta_id = ?",
        [req.user.id, pollId]
      );

      if (existingVoteRows.length > 0) {
        throw createHttpError(409, "You have already voted on this poll");
      }

      await connection.query(
        "INSERT INTO votos (usuario_id, encuesta_id, opcion_id) VALUES (?, ?, ?)",
        [req.user.id, pollId, opcionId]
      );

      await connection.commit();

      const [updatedPollRows] = await pool.query(
        `SELECT
          e.encuesta_id AS id,
          e.pregunta,
          e.fecha_fin AS fechaFin,
          e.esta_activa AS estaActiva,
          u.usuario_id AS creadaPorId,
          u.nombre AS creadaPorNombre
        FROM encuestas e
        INNER JOIN usuarios u ON u.usuario_id = e.creada_por_id
        WHERE e.encuesta_id = ?`,
        [pollId]
      );

      const updatedPoll = mapPoll(updatedPollRows[0]);

      const [optionRowsUpdated] = await pool.query(
        `SELECT
          o.opcion_id AS id,
          o.texto_opcion AS textoOpcion,
          COUNT(v.voto_id) AS voteCount
        FROM opciones_encuesta o
        LEFT JOIN votos v ON v.opcion_id = o.opcion_id
        WHERE o.encuesta_id = ?
        GROUP BY o.opcion_id, o.texto_opcion
        ORDER BY o.opcion_id ASC`,
        [pollId]
      );

      updatedPoll.options = optionRowsUpdated.map(mapPollOption);
      updatedPoll.userVote = opcionId;

      res.json(updatedPoll);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

router.patch(
  "/:pollId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const { pregunta, fechaFin, estaActiva } = req.body;

    const [existingRows] = await pool.query(
      "SELECT encuesta_id FROM encuestas WHERE encuesta_id = ?",
      [pollId]
    );

    if (existingRows.length === 0) {
      throw createHttpError(404, "Poll not found");
    }

    const updates = [];
    const values = [];

    if (typeof pregunta !== "undefined") {
      updates.push("pregunta = ?");
      values.push(pregunta);
    }
    if (typeof fechaFin !== "undefined") {
      updates.push("fecha_fin = ?");
      values.push(fechaFin);
    }
    if (typeof estaActiva !== "undefined") {
      updates.push("esta_activa = ?");
      values.push(estaActiva ? 1 : 0);
    }

    if (updates.length === 0) {
      throw createHttpError(400, "No fields to update");
    }

    values.push(pollId);

    await pool.query(
      `UPDATE encuestas SET ${updates.join(", ")} WHERE encuesta_id = ?`,
      values
    );

    const [pollRows] = await pool.query(
      `SELECT
        e.encuesta_id AS id,
        e.pregunta,
        e.fecha_fin AS fechaFin,
        e.esta_activa AS estaActiva,
        u.usuario_id AS creadaPorId,
        u.nombre AS creadaPorNombre
      FROM encuestas e
      INNER JOIN usuarios u ON u.usuario_id = e.creada_por_id
      WHERE e.encuesta_id = ?`,
      [pollId]
    );

    const poll = mapPoll(pollRows[0]);

    const [optionRows] = await pool.query(
      `SELECT
        o.opcion_id AS id,
        o.texto_opcion AS textoOpcion,
        COUNT(v.voto_id) AS voteCount
      FROM opciones_encuesta o
      LEFT JOIN votos v ON v.opcion_id = o.opcion_id
      WHERE o.encuesta_id = ?
      GROUP BY o.opcion_id, o.texto_opcion
      ORDER BY o.opcion_id ASC`,
      [pollId]
    );

    poll.options = optionRows.map(mapPollOption);

    res.json(poll);
  })
);

router.delete(
  "/:pollId",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pollId } = req.params;

    const [result] = await pool.query(
      "DELETE FROM encuestas WHERE encuesta_id = ?",
      [pollId]
    );

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Poll not found");
    }

    res.status(204).send();
  })
);

module.exports = router;

