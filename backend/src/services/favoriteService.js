const fs = require("fs");
const path = require("path");

const getDataFile = () =>
  process.env.FAVORITES_DATA_FILE || path.join(__dirname, "..", "..", "data", "favorites.json");

let store = new Map(); // userId -> { films: Set, characters: Set }

const ensureUser = (userId) => {
  const id = String(userId || "anonymous");
  if (!store.has(id)) {
    store.set(id, { films: new Set(), characters: new Set() });
  }
  return { id, entry: store.get(id) };
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
      store.set(userId, {
        films: new Set((value?.films || []).map(String)),
        characters: new Set((value?.characters || []).map(String)),
      });
    }
  } catch (_err) {
    store = new Map();
  }
};

load();

const addFavoriteFilm = (id, userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  entry.films.add(String(id));
  persist();
  return Array.from(entry.films);
};

const removeFavoriteFilm = (id, userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  const removed = entry.films.delete(String(id));
  if (removed) persist();
  return removed;
};

const getFavoriteFilms = (userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  return Array.from(entry.films);
};

const addFavoriteCharacter = (id, userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  entry.characters.add(String(id));
  persist();
  return Array.from(entry.characters);
};

const removeFavoriteCharacter = (id, userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  const removed = entry.characters.delete(String(id));
  if (removed) persist();
  return removed;
};

const getFavoriteCharacters = (userId = "anonymous") => {
  const { entry } = ensureUser(userId);
  return Array.from(entry.characters);
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
