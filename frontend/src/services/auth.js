import { apiClient } from "./apiClient.js";

export const loginRequest = async ({ email, password }) =>
  apiClient({
    method: "POST",
    path: "/auth/login",
    body: { email, password },
  });

export const registerRequest = async ({ nombre, email, password }) =>
  apiClient({
    method: "POST",
    path: "/auth/register",
    body: { nombre, email, password },
  });

