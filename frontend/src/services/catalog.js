import { apiClient } from "./apiClient.js";

export const fetchCollections = () =>
  apiClient({
    method: "GET",
    path: "/catalog/collections",
  });

export const fetchProductsByCollection = (collectionId) =>
  apiClient({
    method: "GET",
    path: `/catalog/collections/${collectionId}/products`,
  });

export const fetchInventoryByProduct = (productId) =>
  apiClient({
    method: "GET",
    path: `/catalog/products/${productId}/inventory`,
  });

