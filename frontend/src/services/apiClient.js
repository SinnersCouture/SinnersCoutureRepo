import { API_BASE_URL } from "../config";

const buildUrl = (path, searchParams) => {
  const url = new URL(path, API_BASE_URL);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value !== "undefined" && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

const normalizeBody = (body) => {
  if (typeof body === "undefined" || body === null) {
    return undefined;
  }

  return JSON.stringify(body);
};

const parseResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export const apiClient = async ({
  method = "GET",
  path,
  body,
  token,
  searchParams,
  headers,
}) => {
  const url = buildUrl(path, searchParams);
  const requestHeaders = new Headers({
    "Content-Type": "application/json",
    ...headers,
  });

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: normalizeBody(body),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : response.statusText;
    const error = new Error(errorMessage || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

