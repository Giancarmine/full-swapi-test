const fs = require("fs");
const path = require("path");
const { tooManyRequests } = require("../utils/httpError");
const { isValidUserId } = require("../utils/userId");

const DEFAULT_MAX_USERS = 10000;
const DEFAULT_MAX_ITEMS = 100;

const getDataFile = () =>
  process.env.FAVORITES_DATA_FILE || path.join(__dirname, "..", "..", "data", "favorites.json");

let store = new Map(); // userId -> { films: Set, characters: Set }

const positiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const maxUsers = () => positiveInt(process.env.FAVORITES_MAX_USERS, DEFAULT_MAX_USERS);
const maxItems = () => positiveInt(process.env.FAVORITES_MAX_ITEMS, DEFAULT_MAX_ITEMS);

const normalizeId = (userId) => String(userId || "anonymous");

const getUser = (userId) => store.get(normalizeId(userId)) || null;

const ensureUser = (userId) => {
  const id = normalizeId(userId);
  const existing = store.get(id);
  if (existing) return { id, entry: existing };

  if (store.size >= maxUsers()) {
    throw tooManyRequests("Favorites user limit reached", "favorites_user_limit_reached");
  }

  const entry = { films: new Set(), characters: new Set() };
  store.set(id, entry);
  return { id, entry };
};

const removeEmptyUser = (id, entry) => {
  if (entry.films.size === 0 && entry.characters.size === 0) {
    store.delete(id);
  }
};

const shouldPersist = () => {
  if (process.env.FAVORITES_PERSIST === "true") return true;
  if (process.env.FAVORITES_PERSIST === "false") return false;
  return process.env.NODE_ENV !== "test";
};

const persist = () => {
  if (!shouldPersist()) return;
  const dataFile = getDataFile();
  try {
    const dir = path.dirname(dataFile);
    fs.mkdirSync(dir, { recursive: true });
    const obj = {};
    for (const [userId, entry] of store.entries()) {
      obj[userId] = {
        films: Array.from(entry.films),
        characters: Array.from(entry.characters),
      };
    }
    const tmpFile = `${dataFile}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(obj, null, 2));
    fs.renameSync(tmpFile, dataFile);
  } catch (err) {
    // Persistence failures should not break API responses, but should be visible in logs.
    console.warn(`[favorites] Failed to persist favorites to ${dataFile}: ${err.message}`);
  }
};

const load = () => {
  if (!shouldPersist() && !process.env.FAVORITES_DATA_FILE) return;
  try {
    const dataFile = getDataFile();
    if (!fs.existsSync(dataFile)) return;
    const raw = fs.readFileSync(dataFile, "utf8");
    const obj = JSON.parse(raw || "{}");
    store = new Map();

    for (const [userId, value] of Object.entries(obj)) {
      if (store.size >= maxUsers()) break;
      if (!isValidUserId(userId)) continue;

      const films = Array.from(new Set((value?.films || []).map(String))).slice(0, maxItems());
      const characters = Array.from(new Set((value?.characters || []).map(String))).slice(
        0,
        maxItems()
      );

      if (films.length || characters.length) {
        store.set(userId, {
          films: new Set(films),
          characters: new Set(characters),
        });
      }
    }
  } catch (_err) {
    store = new Map();
  }
};

load();

const addToEntry = (entry, key, id) => {
  const value = String(id);
  if (entry[key].has(value)) return false;

  if (entry[key].size >= maxItems()) {
    throw tooManyRequests("Favorites item limit reached", "favorites_limit_reached");
  }

  entry[key].add(value);
  return true;
};

const addFavoriteFilm = (id, userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  if (addToEntry(entry, "films", id)) persist();
  return Array.from(entry.films);
};

const removeFavoriteFilm = (id, userId = "anonymous") => {
  const normalized = normalizeId(userId);
  const entry = store.get(normalized);
  if (!entry) return false;

  const removed = entry.films.delete(String(id));
  if (removed) {
    removeEmptyUser(normalized, entry);
    persist();
  }
  return removed;
};

const getFavoriteFilms = (userId = "anonymous") => {
  const entry = getUser(userId);
  return entry ? Array.from(entry.films) : [];
};

const addFavoriteCharacter = (id, userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  if (addToEntry(entry, "characters", id)) persist();
  return Array.from(entry.characters);
};

const removeFavoriteCharacter = (id, userId = "anonymous") => {
  const normalized = normalizeId(userId);
  const entry = store.get(normalized);
  if (!entry) return false;

  const removed = entry.characters.delete(String(id));
  if (removed) {
    removeEmptyUser(normalized, entry);
    persist();
  }
  return removed;
};

const getFavoriteCharacters = (userId = "anonymous") => {
  const entry = getUser(userId);
  return entry ? Array.from(entry.characters) : [];
};

const _resetForTests = () => {
  store = new Map();
};

const _reloadForTests = () => {
  load();
};

module.exports = {
  addFavoriteFilm,
  removeFavoriteFilm,
  getFavoriteFilms,
  addFavoriteCharacter,
  removeFavoriteCharacter,
  getFavoriteCharacters,
  _resetForTests,
  _reloadForTests,
};
