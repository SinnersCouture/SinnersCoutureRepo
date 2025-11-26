import { apiClient } from "./apiClient.js";

export const fetchPolls = () =>
  apiClient({
    method: "GET",
    path: "/polls",
  });

export const fetchPollById = (pollId, token) =>
  apiClient({
    method: "GET",
    path: `/polls/${pollId}`,
    token,
  });

export const createPoll = ({ token, pregunta, fechaFin, opciones }) =>
  apiClient({
    method: "POST",
    path: "/polls",
    token,
    body: { pregunta, fechaFin, opciones },
  });

export const voteOnPoll = ({ token, pollId, opcionId }) =>
  apiClient({
    method: "POST",
    path: `/polls/${pollId}/vote`,
    token,
    body: { opcionId },
  });

export const updatePoll = ({ token, pollId, pregunta, fechaFin, estaActiva }) =>
  apiClient({
    method: "PATCH",
    path: `/polls/${pollId}`,
    token,
    body: { pregunta, fechaFin, estaActiva },
  });

export const deletePoll = ({ token, pollId }) =>
  apiClient({
    method: "DELETE",
    path: `/polls/${pollId}`,
    token,
  });

