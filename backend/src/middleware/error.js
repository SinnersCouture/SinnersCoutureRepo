const notFoundHandler = (_req, res, _next) => {
  res.status(404).json({ message: "Not found" });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

