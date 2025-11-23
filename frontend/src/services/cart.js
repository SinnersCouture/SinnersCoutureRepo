import { apiClient } from "./apiClient.js";

export const fetchCart = (token) =>
  apiClient({
    method: "GET",
    path: "/cart",
    token,
  });

export const updateCartItem = ({ token, inventarioId, cantidad }) =>
  apiClient({
    method: "PUT",
    path: "/cart/items",
    token,
    body: { inventarioId, cantidad },
  });

export const deleteCartItem = ({ token, itemId }) =>
  apiClient({
    method: "DELETE",
    path: `/cart/items/${itemId}`,
    token,
  });

