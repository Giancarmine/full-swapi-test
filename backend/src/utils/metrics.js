const client = require("prom-client");
const cache = require("./cache");

const register = new client.Registry();
register.setDefaultLabels({ app: "full-swapi-backend" });
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests handled.",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds.",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const cacheEntries = new client.Gauge({
  name: "cache_entries",
  help: "Number of entries currently held in the in-memory cache.",
  registers: [register],
});

const requestLabels = (req, res) => ({
  method: req.method,
  route: req.route ? `${req.baseUrl}${req.route.path}` : "unmatched",
  status: String(res.statusCode),
});

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const labels = requestLabels(req, res);
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, Number(process.hrtime.bigint() - start) / 1e9);
  });
  next();
};

const metricsHandler = async (req, res, next) => {
  try {
    cacheEntries.set(cache.getStats().size);
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  cacheEntries,
};
