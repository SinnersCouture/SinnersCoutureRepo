import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

const pool = await mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppass",
  database: process.env.DB_NAME || "appdb",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.get("/items", async (_req, res) => {
  const [rows] = await pool.query("SELECT id, name FROM items ORDER BY id DESC");
  res.json(rows);
});

app.post("/items", async (req, res) => {
  const { name } = req.body;
  const [r] = await pool.query("INSERT INTO items(name) VALUES (?)", [name]);
  res.status(201).json({ id: r.insertId, name });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`API on ${port}`));
