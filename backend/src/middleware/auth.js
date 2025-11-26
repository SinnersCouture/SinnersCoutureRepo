const jwt = require("jsonwebtoken");

const config = require("../config");
const { createHttpError } = require("../utils/errors");

const authenticate = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(createHttpError(401, "Authorization header missing"));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      nombre: payload.nombre,
      isAdmin: Boolean(payload.isAdmin),
    };
    return next();
  } catch (_error) {
    return next(createHttpError(401, "Invalid token"));
  }
};

const optionalAuthenticate = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      nombre: payload.nombre,
      isAdmin: Boolean(payload.isAdmin),
    };
  } catch {
    // ignore invalid token for optional auth
  }

  return next();
};

const requireAdmin = (req, _res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next(createHttpError(403, "Admin access required"));
  }

  return next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
};

