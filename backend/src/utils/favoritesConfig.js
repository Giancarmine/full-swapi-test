const path = require("path");

const DEFAULT_MAX_USERS = 10000;
const DEFAULT_MAX_ITEMS = 100;

const positiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const maxUsers = () => positiveInt(process.env.FAVORITES_MAX_USERS, DEFAULT_MAX_USERS);
const maxItems = () => positiveInt(process.env.FAVORITES_MAX_ITEMS, DEFAULT_MAX_ITEMS);

const getDataFile = () =>
  process.env.FAVORITES_DATA_FILE || path.join(__dirname, "..", "..", "data", "favorites.json");

const getDbFile = () =>
  process.env.FAVORITES_DB_FILE || path.join(__dirname, "..", "..", "data", "favorites.db");

const shouldPersist = () => {
  if (process.env.FAVORITES_PERSIST === "true") return true;
  if (process.env.FAVORITES_PERSIST === "false") return false;
  return process.env.NODE_ENV !== "test";
};

module.exports = {
  DEFAULT_MAX_USERS,
  DEFAULT_MAX_ITEMS,
  positiveInt,
  maxUsers,
  maxItems,
  getDataFile,
  getDbFile,
  shouldPersist,
};
