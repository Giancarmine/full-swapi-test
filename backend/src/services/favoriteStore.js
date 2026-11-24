const fs = require("fs");
const path = require("path");
const { isValidUserId } = require("../utils/userId");
const { getDataFile, getDbFile, maxUsers, maxItems } = require("../utils/favoritesConfig");

const cloneEntry = (entry) => ({
  films: [...(entry?.films || [])],
  characters: [...(entry?.characters || [])],
});

const sanitizeEntry = (entry) => {
  const films = Array.from(new Set((entry?.films || []).map(String))).slice(0, maxItems());
  const characters = Array.from(new Set((entry?.characters || []).map(String))).slice(
    0,
    maxItems()
  );
  return { films, characters };
};

const createMemoryStore = () => {
  const rows = new Map();

  return {
    type: "memory",
    get(userId) {
      const entry = rows.get(userId);
      return entry ? cloneEntry(entry) : null;
    },
    put(userId, entry) {
      rows.set(userId, cloneEntry(entry));
    },
    delete(userId) {
      return rows.delete(userId);
    },
    has(userId) {
      return rows.has(userId);
    },
    size() {
      return rows.size;
    },
    all() {
      return Array.from(rows, ([userId, entry]) => [userId, cloneEntry(entry)]);
    },
    clear() {
      rows.clear();
    },
    reload() {},
    ping() {
      return true;
    },
    close() {},
  };
};

const createJsonStore = (file) => {
  let rows = new Map();

  const write = () => {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const obj = {};
      for (const [userId, entry] of rows.entries()) {
        obj[userId] = cloneEntry(entry);
      }
      const tmpFile = `${file}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(obj, null, 2));
      fs.renameSync(tmpFile, file);
    } catch (err) {
      console.warn(`[favorites] Failed to persist favorites to ${file}: ${err.message}`);
    }
  };

  const reload = () => {
    try {
      if (!fs.existsSync(file)) {
        rows = new Map();
        return;
      }
      const obj = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
      const next = new Map();
      for (const [userId, value] of Object.entries(obj || {})) {
        if (next.size >= maxUsers()) break;
        if (!isValidUserId(userId)) continue;
        const entry = sanitizeEntry(value);
        if (entry.films.length || entry.characters.length) {
          next.set(userId, entry);
        }
      }
      rows = next;
    } catch (_err) {
      rows = new Map();
    }
  };

  reload();

  return {
    type: "json",
    get(userId) {
      const entry = rows.get(userId);
      return entry ? cloneEntry(entry) : null;
    },
    put(userId, entry) {
      rows.set(userId, cloneEntry(entry));
      write();
    },
    delete(userId) {
      const removed = rows.delete(userId);
      if (removed) write();
      return removed;
    },
    has(userId) {
      return rows.has(userId);
    },
    size() {
      return rows.size;
    },
    all() {
      return Array.from(rows, ([userId, entry]) => [userId, cloneEntry(entry)]);
    },
    clear() {
      rows.clear();
    },
    reload,
    ping() {
      return true;
    },
    close() {},
  };
};

const createSqliteStore = (file) => {
  // node:sqlite ships with the Node 22+/24+ baseline and needs no native build step.
  const { DatabaseSync } = require("node:sqlite");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(
    "CREATE TABLE IF NOT EXISTS favorites (" +
      "user_id TEXT PRIMARY KEY, " +
      "films TEXT NOT NULL DEFAULT '[]', " +
      "characters TEXT NOT NULL DEFAULT '[]')"
  );

  const select = db.prepare("SELECT films, characters FROM favorites WHERE user_id = ?");
  const upsert = db.prepare(
    "INSERT INTO favorites (user_id, films, characters) VALUES (?, ?, ?) " +
      "ON CONFLICT(user_id) DO UPDATE SET films = excluded.films, characters = excluded.characters"
  );
  const remove = db.prepare("DELETE FROM favorites WHERE user_id = ?");
  const count = db.prepare("SELECT COUNT(*) AS total FROM favorites");
  const allRows = db.prepare("SELECT user_id, films, characters FROM favorites");
  const ping = db.prepare("SELECT 1 AS ok");

  const parseRow = (row) =>
    row
      ? {
          films: JSON.parse(row.films || "[]"),
          characters: JSON.parse(row.characters || "[]"),
        }
      : null;

  return {
    type: "sqlite",
    get(userId) {
      return parseRow(select.get(userId));
    },
    put(userId, entry) {
      const clean = cloneEntry(entry);
      upsert.run(userId, JSON.stringify(clean.films), JSON.stringify(clean.characters));
    },
    delete(userId) {
      return remove.run(userId).changes > 0;
    },
    has(userId) {
      return select.get(userId) !== undefined;
    },
    size() {
      return Number(count.get().total);
    },
    all() {
      return allRows.all().map((row) => [row.user_id, parseRow(row)]);
    },
    clear() {
      db.exec("DELETE FROM favorites");
    },
    reload() {},
    ping() {
      return ping.get().ok === 1;
    },
    close() {
      db.close();
    },
  };
};

const resolveStoreType = () => {
  const explicit = process.env.FAVORITES_STORE;
  if (explicit === "memory" || explicit === "json" || explicit === "sqlite") return explicit;
  if (process.env.FAVORITES_PERSIST === "true" || process.env.FAVORITES_DATA_FILE) return "json";
  if (process.env.NODE_ENV === "test") return "memory";
  return "sqlite";
};

// One store per process; services talk only to this interface.
const store = (() => {
  const type = resolveStoreType();
  try {
    if (type === "sqlite") return createSqliteStore(getDbFile());
    if (type === "json") return createJsonStore(getDataFile());
    return createMemoryStore();
  } catch (err) {
    console.warn(`[favorites] ${type} store unavailable (${err.message}); using memory store.`);
    return createMemoryStore();
  }
})();

module.exports = {
  store,
  createMemoryStore,
  createJsonStore,
  createSqliteStore,
  resolveStoreType,
};
