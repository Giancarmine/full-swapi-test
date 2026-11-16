const DEFAULT_TTL_MS = 5 * 60 * 1000;

const store = new Map();

const now = () => Date.now();

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, {
    value,
    expiresAt: now() + ttlMs,
  });
};

const del = (key) => {
  store.delete(key);
};

const clear = () => {
  store.clear();
};

const getOrSet = async (key, fetcher, ttlMs = DEFAULT_TTL_MS) => {
  const cached = get(key);
  if (cached !== null) return cached;
  const value = await fetcher();
  set(key, value, ttlMs);
  return value;
};

module.exports = {
  get,
  set,
  del,
  clear,
  getOrSet,
  DEFAULT_TTL_MS,
};
