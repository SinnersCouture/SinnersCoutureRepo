const requiredEnv = (name) => {
  const value = process.env[name];
  if (typeof value === "undefined" || value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const toNumber = (value, name) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return numberValue;
};

const port = toNumber(requiredEnv("PORT"), "PORT");
const dbPort = toNumber(requiredEnv("DB_PORT"), "DB_PORT");

module.exports = {
  port,
  corsOrigin: requiredEnv("CORS_ORIGIN"),
  db: {
    host: requiredEnv("DB_HOST"),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_NAME"),
    port: dbPort,
  },
  auth: {
    jwtSecret: requiredEnv("JWT_SECRET"),
    jwtExpiresIn: requiredEnv("JWT_EXPIRES_IN"),
  },
};

