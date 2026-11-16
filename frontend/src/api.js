const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

async function request(path, options = {}, userId = "anonymous") {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId || "anonymous",
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}

export const api = {
  getHealth: () => request("/health"),
  getFilms: () => request("/api/films"),
  getCharacters: () => request("/api/characters"),
  getFavorites: (userId) => request("/api/favorites", {}, userId),
  addFavoriteFilm: (id, userId) => request(`/api/favorites/films/${id}`, { method: "POST" }, userId),
  removeFavoriteFilm: (id, userId) => request(`/api/favorites/films/${id}`, { method: "DELETE" }, userId),
  addFavoriteCharacter: (id, userId) =>
    request(`/api/favorites/characters/${id}`, { method: "POST" }, userId),
  removeFavoriteCharacter: (id, userId) =>
    request(`/api/favorites/characters/${id}`, { method: "DELETE" }, userId),
};
