const requireEnv = (name) => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const API_BASE_URL = (() => {
  const value = requireEnv("VITE_API_BASE_URL").replace(/\/$/, "");
  return value;
})();

