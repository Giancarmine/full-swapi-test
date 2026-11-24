const { tooManyRequests } = require("../utils/httpError");
const { maxUsers, maxItems } = require("../utils/favoritesConfig");
const { store } = require("./favoriteStore");

const normalizeId = (userId) => String(userId || "anonymous");

const ensureUser = (userId) => {
  const id = normalizeId(userId);
  const existing = store.get(id);
  if (existing) return { id, entry: existing };

  if (store.size() >= maxUsers()) {
    throw tooManyRequests("Favorites user limit reached", "favorites_user_limit_reached");
  }

  const entry = { films: [], characters: [] };
  store.put(id, entry);
  return { id, entry };
};

const addToEntry = (entry, key, id) => {
  const value = String(id);
  if (entry[key].includes(value)) return false;

  if (entry[key].length >= maxItems()) {
    throw tooManyRequests("Favorites item limit reached", "favorites_limit_reached");
  }

  entry[key].push(value);
  return true;
};

const addFavoriteFilm = (id, userId = "anonymous") => {
  const { id: normalized, entry } = ensureUser(userId);
  if (addToEntry(entry, "films", id)) store.put(normalized, entry);
  return Array.from(entry.films);
};

const removeFavoriteFilm = (id, userId = "anonymous") => {
  const normalized = normalizeId(userId);
  const entry = store.get(normalized);
  if (!entry) return false;

  const index = entry.films.indexOf(String(id));
  if (index === -1) return false;

  entry.films.splice(index, 1);
  if (entry.films.length === 0 && entry.characters.length === 0) {
    store.delete(normalized);
  } else {
    store.put(normalized, entry);
  }
  return true;
};

const getFavoriteFilms = (userId = "anonymous") => {
  const entry = store.get(normalizeId(userId));
  return entry ? Array.from(entry.films) : [];
};

const addFavoriteCharacter = (id, userId = "anonymous") => {
  const { id: normalized, entry } = ensureUser(userId);
  if (addToEntry(entry, "characters", id)) store.put(normalized, entry);
  return Array.from(entry.characters);
};

const removeFavoriteCharacter = (id, userId = "anonymous") => {
  const normalized = normalizeId(userId);
  const entry = store.get(normalized);
  if (!entry) return false;

  const index = entry.characters.indexOf(String(id));
  if (index === -1) return false;

  entry.characters.splice(index, 1);
  if (entry.films.length === 0 && entry.characters.length === 0) {
    store.delete(normalized);
  } else {
    store.put(normalized, entry);
  }
  return true;
};

const getFavoriteCharacters = (userId = "anonymous") => {
  const entry = store.get(normalizeId(userId));
  return entry ? Array.from(entry.characters) : [];
};

const getStoreHealth = () => ({ store: store.type, ok: store.ping() });

const _resetForTests = () => {
  store.clear();
};

const _reloadForTests = () => {
  store.reload();
};

module.exports = {
  addFavoriteFilm,
  removeFavoriteFilm,
  getFavoriteFilms,
  addFavoriteCharacter,
  removeFavoriteCharacter,
  getFavoriteCharacters,
  getStoreHealth,
  _resetForTests,
  _reloadForTests,
};
