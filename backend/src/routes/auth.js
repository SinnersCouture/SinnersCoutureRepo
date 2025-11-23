const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db/pool");
const config = require("../config");
const asyncHandler = require("../utils/asyncHandler");
const { createHttpError } = require("../utils/errors");

const router = express.Router();

const normalizeUser = (row) => ({
  id: row.usuario_id,
  nombre: row.nombre,
  email: row.email,
  isAdmin: Boolean(row.es_admin),
});

const issueToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      isAdmin: user.isAdmin,
    },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      throw createHttpError(400, "nombre, email, and password are required");
    }

    const [existingUsers] = await pool.query(
      "SELECT usuario_id FROM usuarios WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      throw createHttpError(409, "Email already registered");
    }

    const hash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, email, hash_contrasena) VALUES (?, ?, ?)",
      [nombre, email, hash]
    );

    const user = normalizeUser({
      usuario_id: result.insertId,
      nombre,
      email,
      es_admin: false,
    });

    const token = issueToken(user);

    res.status(201).json({ token, user });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createHttpError(400, "email and password are required");
    }

    const [rows] = await pool.query(
      "SELECT usuario_id, nombre, email, hash_contrasena, es_admin FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      throw createHttpError(401, "Invalid credentials");
    }

    const [userRow] = rows;

    const passwordMatches = await bcrypt.compare(password, userRow.hash_contrasena);

    if (!passwordMatches) {
      throw createHttpError(401, "Invalid credentials");
    }

    const user = normalizeUser(userRow);
    const token = issueToken(user);

    res.json({ token, user });
  })
);

module.exports = router;

