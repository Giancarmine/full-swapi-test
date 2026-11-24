const DEFAULT_LIST_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

const listCacheControl = (req, res, next) => {
  res.set("Cache-Control", process.env.LIST_CACHE_CONTROL || DEFAULT_LIST_CACHE_CONTROL);
  next();
};

module.exports = { listCacheControl, DEFAULT_LIST_CACHE_CONTROL };
