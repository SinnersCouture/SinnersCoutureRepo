import { apiClient } from "./apiClient.js";

export const fetchPosts = () =>
  apiClient({
    method: "GET",
    path: "/blog/posts",
  });

export const fetchPostById = (postId) =>
  apiClient({
    method: "GET",
    path: `/blog/posts/${postId}`,
  });

export const createPost = ({ token, titulo, contenido }) =>
  apiClient({
    method: "POST",
    path: "/blog/posts",
    token,
    body: { titulo, contenido },
  });

export const updatePost = ({ token, postId, titulo, contenido }) =>
  apiClient({
    method: "PATCH",
    path: `/blog/posts/${postId}`,
    token,
    body: { titulo, contenido },
  });

export const deletePost = ({ token, postId }) =>
  apiClient({
    method: "DELETE",
    path: `/blog/posts/${postId}`,
    token,
  });

export const addComment = ({ token, postId, contenido }) =>
  apiClient({
    method: "POST",
    path: `/blog/posts/${postId}/comments`,
    token,
    body: { contenido },
  });

export const deleteComment = ({ token, commentId }) =>
  apiClient({
    method: "DELETE",
    path: `/blog/comments/${commentId}`,
    token,
  });

