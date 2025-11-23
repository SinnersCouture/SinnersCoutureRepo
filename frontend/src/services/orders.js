import { apiClient } from "./apiClient.js";

export const fetchOrders = (token) =>
  apiClient({
    method: "GET",
    path: "/orders",
    token,
  });

export const fetchOrderById = ({ token, orderId }) =>
  apiClient({
    method: "GET",
    path: `/orders/${orderId}`,
    token,
  });

export const createOrder = (token) =>
  apiClient({
    method: "POST",
    path: "/orders",
    token,
  });

