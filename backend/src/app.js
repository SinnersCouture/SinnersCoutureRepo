const express = require("express");
const cors = require("cors");

const config = require("./config");
const pool = require("./db/pool");
const { registerRoutes } = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/error");

const app = express();

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return originalJson.call(this, data);
  };
  next();
});

app.use(express.json());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

