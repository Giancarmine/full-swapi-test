const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 500;

const store = new Map();
const inFlight = new Map();
const stats = { hits: 0, misses: 0, evictions: 0, expirations: 0 };

const now = () => Date.now();

const maxEntries = () => {
  const parsed = Number(process.env.CACHE_MAX_ENTRIES);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ENTRIES;
};

const sweepExpired = () => {
  const current = now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= current) {
      store.delete(key);
      stats.expirations += 1;
    }
  }
};

const get = (key) => {
  const entry = store.get(key);
  if (!entry) {
    stats.misses += 1;
    return null;
  }
  if (entry.expiresAt <= now()) {
    store.delete(key);
    stats.expirations += 1;
    stats.misses += 1;
    return null;
  }
  // Refresh insertion order so eviction behaves like an LRU cache.
  store.delete(key);
  store.set(key, entry);
  stats.hits += 1;
  return entry.value;
};

const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  sweepExpired();
  if (store.has(key)) {
    store.delete(key);
  } else if (store.size >= maxEntries()) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
    stats.evictions += 1;
  }
  store.set(key, {
    value,
    expiresAt: now() + ttlMs,
  });
};

const del = (key) => {
  store.delete(key);
  inFlight.delete(key);
};

const clear = () => {
  store.clear();
  inFlight.clear();
  stats.hits = 0;
  stats.misses = 0;
  stats.evictions = 0;
  stats.expirations = 0;
};

const getOrSet = async (key, fetcher, ttlMs = DEFAULT_TTL_MS) => {
  const cached = get(key);
  if (cached !== null) return cached;

  // De-duplicate concurrent cold loads for the same key.
  if (inFlight.has(key)) return inFlight.get(key);

  const pending = (async () => {
    const value = await fetcher();
    set(key, value, ttlMs);
    return value;
  })();

  inFlight.set(key, pending);
  try {
    return await pending;
  } finally {
    inFlight.delete(key);
  }
};

const getStats = () => ({ size: store.size, ...stats });

module.exports = {
  get,
  set,
  del,
  clear,
  getOrSet,
  getStats,
  DEFAULT_TTL_MS,
  DEFAULT_MAX_ENTRIES,
};
