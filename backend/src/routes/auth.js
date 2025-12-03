const express = require("express");
const bcrypt = require("bcryptjs");
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
    console.log("[REGISTER] Request received", { 
      bodyKeys: Object.keys(req.body || {}),
      hasNombre: !!req.body?.nombre,
      hasEmail: !!req.body?.email,
      hasPassword: !!req.body?.password 
    });

    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      console.log("[REGISTER] Validation failed - missing required fields");
      throw createHttpError(400, "nombre, email, and password are required");
    }

    if (typeof nombre !== "string" || typeof email !== "string" || typeof password !== "string") {
      console.log("[REGISTER] Validation failed - invalid field types");
      throw createHttpError(400, "nombre, email, and password must be strings");
    }

    if (password.length > 128) {
      console.log("[REGISTER] Validation failed - password too long");
      throw createHttpError(400, "Password is too long");
    }

    if (email.length > 255) {
      console.log("[REGISTER] Validation failed - email too long");
      throw createHttpError(400, "Email is too long");
    }

    if (password.length === 0) {
      console.log("[REGISTER] Validation failed - password is empty");
      throw createHttpError(400, "Password cannot be empty");
    }

    if (password.includes("\0")) {
      console.log("[REGISTER] Validation failed - password contains null bytes");
      throw createHttpError(400, "Password contains invalid characters");
    }

    try {
      Buffer.from(password, "utf8");
    } catch (encodingError) {
      console.log("[REGISTER] Validation failed - password encoding error:", encodingError);
      throw createHttpError(400, "Password contains invalid characters");
    }

    console.log("[REGISTER] Checking for existing user with email:", email);
    let existingUsers;
    try {
      [existingUsers] = await pool.query(
        "SELECT usuario_id FROM usuarios WHERE email = ?",
        [email]
      );
      console.log("[REGISTER] Existing users query completed", { count: existingUsers.length });
    } catch (dbError) {
      console.error("[REGISTER] Database error checking existing users:", dbError);
      throw dbError;
    }

    if (existingUsers.length > 0) {
      console.log("[REGISTER] Email already registered:", email);
      throw createHttpError(409, "Email already registered");
    }

    console.log("[REGISTER] Hashing password", { 
      passwordLength: password.length,
      passwordType: typeof password 
    });
    let hash;
    try {
      hash = await bcrypt.hash(password, 12);
      if (!hash || typeof hash !== "string") {
        console.error("[REGISTER] Invalid hash result:", { hash, hashType: typeof hash });
        throw createHttpError(500, "Failed to hash password - invalid result");
      }
      console.log("[REGISTER] Password hashed successfully", { hashLength: hash.length });
    } catch (bcryptError) {
      console.error("[REGISTER] Bcrypt error:", bcryptError);
      console.error("[REGISTER] Bcrypt error details:", {
        message: bcryptError?.message,
        stack: bcryptError?.stack,
        name: bcryptError?.name
      });
      throw createHttpError(500, "Failed to hash password");
    }

    console.log("[REGISTER] Inserting new user into database");
    let result;
    try {
      [result] = await pool.query(
        "INSERT INTO usuarios (nombre, email, hash_contrasena) VALUES (?, ?, ?)",
        [nombre, email, hash]
      );
      console.log("[REGISTER] Insert completed", { 
        insertId: result?.insertId,
        affectedRows: result?.affectedRows 
      });
    } catch (insertError) {
      console.error("[REGISTER] Database insert error:", insertError);
      throw insertError;
    }

    if (!result || typeof result.insertId === "undefined" || result.insertId === null) {
      console.error("[REGISTER] Invalid insert result:", result);
      throw createHttpError(500, "Failed to create user - invalid insert result");
    }

    console.log("[REGISTER] Creating user object");
    const user = normalizeUser({
      usuario_id: result.insertId,
      nombre,
      email,
      es_admin: false,
    });

    console.log("[REGISTER] Issuing token");
    let token;
    try {
      token = issueToken(user);
      console.log("[REGISTER] Token issued successfully");
    } catch (tokenError) {
      console.error("[REGISTER] Token generation error:", tokenError);
      throw createHttpError(500, "Failed to generate token");
    }

    console.log("[REGISTER] Registration successful for user:", user.id);
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

